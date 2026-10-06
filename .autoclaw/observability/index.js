/**
 * observability — structured logging, metric aggregation, distributed tracing.
 *
 * No dependencies. All three write to injectable sinks so tests can assert on
 * output without touching stdout or a real exporter.
 */

const LEVELS = Object.freeze({ debug: 10, info: 20, warn: 30, error: 40, silent: 100 });

function percentile(sorted, p) {
  if (!sorted.length) return null;
  if (sorted.length === 1) return sorted[0];
  // Upper nearest-rank: index = ceil(p/100 * n), clamped. For an even count
  // this returns the upper of the two central values (p50 of [100,200] is
  // 200, not the interpolated 150) — latency percentiles read better when a
  // reported "half the requests were slower than this" is never an
  // interpolation the caller has to reason about.
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length)));
  return sorted[idx];
}

class Logger {
  constructor({ level = 'info', stream = process.stdout, base = {}, clock = () => new Date().toISOString() } = {}) {
    this.level = level;
    this.threshold = LEVELS[level] == null ? LEVELS.info : LEVELS[level];
    this.stream = stream;
    this.base = base;
    this.clock = clock;
  }

  _emit(level, msg, fields) {
    if (LEVELS[level] < this.threshold) return;
    const rec = { ts: this.clock(), level, msg, ...this.base, ...(fields || {}) };
    this.stream.write(`${JSON.stringify(rec)}\n`);
  }

  debug(msg, f) { this._emit('debug', msg, f); }
  info(msg, f) { this._emit('info', msg, f); }
  warn(msg, f) { this._emit('warn', msg, f); }
  error(msg, f) { this._emit('error', msg, f); }
}

class Metrics {
  constructor({ prefix = '', clock = () => Date.now() } = {}) {
    this.prefix = prefix;
    this.clock = clock;
    this.counters = new Map();
    this.gauges = new Map();
    this.histograms = new Map();
  }

  /** Stable key: `prefix_name{k="v",…}` with labels sorted for determinism. */
  _key(name, labels) {
    const l = labels || {};
    const parts = Object.keys(l).sort().map(k => `${k}="${String(l[k])}"`);
    const base = this.prefix ? `${this.prefix}_${name}` : String(name);
    return `${base}${parts.length ? `{${parts.join(',')}}` : ''}`;
  }

  inc(name, labels, by = 1) {
    const k = this._key(name, labels);
    this.counters.set(k, (this.counters.get(k) || 0) + Number(by || 0));
    return this.counters.get(k);
  }

  dec(name, labels, by = 1) {
    return this.inc(name, labels, -(Number(by) || 0));
  }

  set(name, labels, value) {
    const k = this._key(name, labels);
    this.gauges.set(k, Number(value));
    return value;
  }

  observe(name, value, labels) {
    const k = this._key(name, labels);
    if (!this.histograms.has(k)) this.histograms.set(k, []);
    this.histograms.get(k).push(Number(value));
    return k;
  }

  histogram(key) {
    const vals = this.histograms.get(key) || [];
    const sorted = [...vals].sort((a, b) => a - b);
    const sum = sorted.reduce((a, b) => a + b, 0);
    return {
      count: sorted.length,
      sum,
      min: sorted.length ? sorted[0] : null,
      max: sorted.length ? sorted[sorted.length - 1] : null,
      mean: sorted.length ? sum / sorted.length : null,
      p50: percentile(sorted, 50),
      p90: percentile(sorted, 90),
      p95: percentile(sorted, 95),
      p99: percentile(sorted, 99)
    };
  }

  /**
   * Prometheus text exposition (v0.0.4).
   *
   * Histogram keys are flattened into the `_bucket`/`_sum`/`_count` series a
   * scraper expects. Label values are escaped so a stray quote or newline in a
   * label cannot corrupt the exposition format.
   */
  renderPrometheus() {
    const esc = s => String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"');
    const lines = [];

    const splitKey = key => {
      const m = /^([^]*?)(\{.*\})?$/.exec(key);
      const labels = m[2] || '';
      const inner = labels.slice(1, -1);
      return { name: m[1], labels: inner, raw: key };
    };

    for (const [key, value] of this.counters) {
      const { name } = splitKey(key);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${key} ${value}`);
    }

    for (const [key, value] of this.gauges) {
      const { name } = splitKey(key);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${key} ${value}`);
    }

    for (const key of this.histograms.keys()) {
      const { name, labels } = splitKey(key);
      const h = this.histogram(key);
      const le = labels ? labels.slice(0, -1) + ',le="+Inf"}' : '{le="+Inf"}';
      lines.push(`# TYPE ${name} histogram`);
      for (const p of [50, 90, 95, 99]) {
        const v = h[`p${p}`];
        if (v == null) continue;
        const bucket = labels ? labels.slice(0, -1) + `,le="${p}"}` : `{le="${p}"}`;
        lines.push(`${name}_bucket${bucket} ${v}`);
      }
      lines.push(`${name}_bucket${le} ${h.max == null ? 0 : h.max}`);
      lines.push(`${name}_sum ${h.sum}`);
      lines.push(`${name}_count ${h.count}`);
    }

    return `${lines.join('\n')}\n`;
  }

  snapshot() {
    const counters = {};
    for (const [k, v] of this.counters) counters[k] = v;
    const gauges = {};
    for (const [k, v] of this.gauges) gauges[k] = v;
    const histograms = {};
    for (const k of this.histograms.keys()) histograms[k] = this.histogram(k);
    return { counters, gauges, histograms };
  }

  reset() {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
  }
}

let spanSeq = 0;

class Span {
  constructor({ traceId, spanId, parentId, name, attributes }) {
    this.traceId = traceId;
    this.spanId = spanId;
    this.parentId = parentId || null;
    this.name = name;
    this.attributes = attributes || {};
    this.startedAt = Date.now();
    this.endedAt = null;
    this.status = null;
    this.error = null;
  }

  set(k, v) { this.attributes[k] = v; return this; }
  end(payload = {}) {
    if (this.endedAt != null) return this;
    this.endedAt = Date.now();
    this.status = payload.status || 'ok';
    if (payload.error) this.error = payload.error;
    if (payload && typeof payload === 'object') Object.assign(this.attributes, payload.attributes || {});
    return this;
  }

  get ms() { return (this.endedAt == null ? Date.now() : this.endedAt) - this.startedAt; }
  toJSON() {
    return {
      traceId: this.traceId,
      spanId: this.spanId,
      parentId: this.parentId,
      name: this.name,
      status: this.status,
      ms: this.ms,
      attributes: this.attributes
    };
  }
}

class Tracer {
  constructor({ clock = () => Date.now() } = {}) {
    this.spans = [];
    this.clock = clock;
  }

  startSpan(name, attributes = {}, parent = null) {
    const traceId = parent ? parent.traceId : `t_${(++spanSeq).toString(36)}_${Math.abs(hash(name + spanSeq)).toString(36)}`;
    const span = new Span({
      traceId,
      spanId: `s_${(++spanSeq).toString(36)}`,
      parentId: parent ? parent.spanId : null,
      name,
      attributes
    });
    this.spans.push(span);
    return span;
  }

  /** Every span in one trace, parents before children. */
  getTrace(traceId) {
    return this.spans.filter(s => s.traceId === traceId).map(s => s.toJSON());
  }

  /** One entry per trace, aggregating duration and failure count. */
  listTraces() {
    const byId = new Map();
    for (const s of this.spans) {
      if (!byId.has(s.traceId)) byId.set(s.traceId, { traceId: s.traceId, spans: 0, ms: 0, failed: 0 });
      const e = byId.get(s.traceId);
      e.spans++;
      e.ms += s.ms;
      if (s.status === 'error') e.failed++;
    }
    return [...byId.values()];
  }

  reset() { this.spans = []; }
}

function hash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h | 0;
}

/** Wire all three with shared defaults. */
function createStack(opts = {}) {
  return {
    logger: new Logger(opts),
    metrics: new Metrics(opts),
    tracer: new Tracer(opts)
  };
}

;

export { LEVELS, Logger, Metrics, Tracer, Span, createStack, percentile };
