import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';
import { ShortTermMemory } from './stm.js';
import { LongTermMemory } from './ltm.js';
import { JSONLStore } from './persistence.js';
import * as promotion from './promotion.js';
import * as retrieval from './retrieval.js';
import { TIER, KIND, DEFAULT_STM, DEFAULT_LTM } from './constants.js';

// createMemory — the unified facade.
function createMemory(opts) {
  opts = opts || {};
  const root = opts.root || path.resolve(import.meta.dirname, '..');
  const ltmFile = opts.ltmFile || path.join(root, 'memory', 'ltm.jsonl');

  const stm = new ShortTermMemory(Object.assign({}, opts.stm || {}));

  const persistence = opts.persistence === false ? null : new JSONLStore({ file: ltmFile });
  const ltm = new LongTermMemory(Object.assign({}, opts.ltm || {}, { persistence }));

  let hydration = { hydrated: 0, ops: 0 };
  if (persistence && opts.hydrate !== false) {
    try { hydration = persistence.hydrate(ltm); }
    catch (_) { hydration = { hydrated: 0, ops: 0, error: true }; }
  }

  const bus = new EventEmitter();
  stm.on('append', e => bus.emit('stm:append', e));
  ltm.on('commit', e => bus.emit('ltm:commit', e));
  ltm.on('access', e => bus.emit('ltm:access', e));
  ltm.on('remove', e => bus.emit('ltm:remove', e));

  return {
    stm, ltm, persistence, bus,
    hydration,

    // STM
    remember(sessionId, entry) { return stm.append(sessionId, entry); },
    recent(sessionId, o)          { return stm.recent(sessionId, o); },
    session(sessionId)            { return stm.all(sessionId); },

    // LTM
    commit(entry)                 { return ltm.commit(entry); },
    get(id)                       { return ltm.get(id); },
    remove(id)                    { return ltm.remove(id); },
    list(o)                       { return ltm.list(o); },

    // Unified
    query(o)                      { return retrieval.unifiedQuery(stm, ltm, o); },

    // Promotion
    promoteEntry(o)               { return promotion.promoteEntry(stm, ltm, o.seq, o); },
    promoteByRepetition(o)        { return promotion.promoteByRepetition(stm, ltm, o); },
    promoteRecent(o)              { return promotion.promoteRecent(stm, ltm, o); },

    // Lifecycle
    decay(o)                      { return ltm.decay(o); },
    flush()                       { return persistence ? persistence.flush() : 0; },
    compact()                     { return persistence ? persistence.compact(ltm) : { entries: 0 }; },

    stats() {
      return {
        stm: stm.stats(),
        ltm: ltm.stats(),
        persistence: persistence ? persistence.stats() : null,
        hydration
      };
    },

    toJSON() {
      return {
        stm: stm.sessions().map(s => ({ sessionId: s, entries: stm.all(s) })),
        ltm: ltm.snapshot(),
        stats: this.stats()
      };
    }
  };
}

export {
  createMemory,
  ShortTermMemory, LongTermMemory, JSONLStore,
  promotion, retrieval,
  TIER, KIND, DEFAULT_STM, DEFAULT_LTM
};
export * from './errors.js';
