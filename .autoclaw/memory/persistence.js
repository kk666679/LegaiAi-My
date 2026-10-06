import fs from 'fs';
import path from 'path';

// Append-only JSONL store. Every op is written as one line.
// load() replays the log and returns the last-write-wins set of entries.
class JSONLStore {
  constructor(opts) {
    opts = opts || {};
    if (!opts.file) throw new Error('JSONLStore requires { file }');
    this.file = opts.file;
    this.fs = opts.fs || fs;
    this.buffer = [];
    this.written = 0;
  }

  append(op) {
    this.buffer.push(Object.assign({ ts: Date.now() }, op));
    return this;
  }

  flush() {
    if (!this.buffer.length) return 0;
    const lines = this.buffer.map(x => JSON.stringify(x)).join('\n') + '\n';
    const dir = path.dirname(this.file);
    this.fs.mkdirSync(dir, { recursive: true });
    this.fs.appendFileSync(this.file, lines, 'utf8');
    const n = this.buffer.length;
    this.buffer.length = 0;
    this.written += n;
    return n;
  }

  load() {
    if (!this.fs.existsSync(this.file)) return { entries: new Map(), ops: 0 };
    const raw = this.fs.readFileSync(this.file, 'utf8');
    const entries = new Map();
    let ops = 0;
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue;
      let op;
      try { op = JSON.parse(line); } catch (_) { continue; }
      ops += 1;
      if (op.op === 'commit' && op.entry && op.entry.id) entries.set(op.entry.id, op.entry);
      else if (op.op === 'remove' && op.id) entries.delete(op.id);
    }
    return { entries, ops };
  }

  hydrate(ltm) {
    const { entries, ops } = this.load();
    for (const e of entries.values()) {
      ltm.entries.set(e.id, e);
      ltm._reindex(e.id, e);
    }
    return { hydrated: entries.size, ops };
  }

  compact(ltm) {
    const tmp = this.file + '.tmp';
    const lines = [];
    for (const e of ltm.entries.values()) lines.push(JSON.stringify({ op: 'commit', entry: e }));
    this.fs.mkdirSync(path.dirname(this.file), { recursive: true });
    this.fs.writeFileSync(tmp, lines.join('\n') + (lines.length ? '\n' : ''), 'utf8');
    this.fs.renameSync(tmp, this.file);
    return { entries: lines.length };
  }

  stats() {
    if (!this.fs.existsSync(this.file)) return { file: this.file, bytes: 0, lines: 0 };
    const stat = this.fs.statSync(this.file);
    const raw = this.fs.readFileSync(this.file, 'utf8');
    const lines = raw.split('\n').filter(Boolean).length;
    return { file: this.file, bytes: stat.size, lines };
  }
}

export { JSONLStore };
