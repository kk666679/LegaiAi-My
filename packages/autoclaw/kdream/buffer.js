import { EventEmitter } from 'events';


/**
 * DreamJournal — bounded ring of cycle events.
 *
 * The cap is the point: a long-lived dreamer must not grow its journal without
 * bound. `flush()` hands the batch to an injectable sink and clears the ring;
 * with no sink it is a no-op that reports `flushed: 0`.
 */
class DreamJournal extends EventEmitter {
  constructor({ capacity = 2000, sink = null } = {}) {
    super();
    this.capacity = Math.max(1, capacity);
    this.sink = sink;
    this.events = [];
    this._seq = 0;
  }

  write(kind, payload = {}) {
    const e = { seq: ++this._seq, ts: Date.now(), kind, ...payload };
    this.events.push(e);
    if (this.events.length > this.capacity) this.events.shift();
    this.emit('write', e);
    this.emit(kind, e);
    return e;
  }

  async flush() {
    if (!this.sink || !this.events.length) return { flushed: 0 };
    const batch = this.events.slice();
    if (typeof this.sink.write === 'function') await this.sink.write(batch);
    else if (typeof this.sink.append === 'function') await this.sink.append(batch);
    else throw new Error('DreamJournal sink must expose write() or append()');
    this.events.length = 0;
    return { flushed: batch.length };
  }

  tail(n = 20) { return this.events.slice(-n); }
  since(seq) { return this.events.filter(e => e.seq > seq); }
  size() { return this.events.length; }
  clear() { this.events.length = 0; }
}

;

export { DreamJournal };
