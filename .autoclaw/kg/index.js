import path from 'path';
import * as canonical from './canonical.js';
import { openStore, SQLiteStore, MemoryStore } from './store.js';
import { KGQuery } from './query.js';
import { KGIngest } from './ingest.js';

/**
 * kg — one-call facade over the knowledge graph.
 *
 *   const kg = createKG({ dbPath: 'kg/kg.db' });  // SQLite
 *   const kg = createKG({ memory: true });        // tests, no sqlite3
 *
 * `kg.store` satisfies the store contract `kgdream` consumes, so a dream cycle
 * can run against either backend without a conditional:
 *
 *   const { createDreamer } = require('../kgdream');
 *   await createDreamer({ store: kg.store }).runCycle({ mode: 'light' });
 */

function createKG({ dbPath, memory, logger, dense, sparse } = {}) {
  const resolved = dbPath || path.resolve(import.meta.dirname, 'kg.db');
  const store = openStore({ dbPath: resolved, memory, logger });
  const query = new KGQuery(store, { dense, sparse });
  const ingest = new KGIngest(store);
  return {
    backend: store instanceof SQLiteStore ? 'sqlite' : 'memory',
    store,
    query,
    ingest,
    getNode: id => store.getNode(id),
    upsert: n => store.upsert(n),
    removeNode: id => store.removeNode(id),
    listNodes: opts => store.listNodes(opts),
    putEdge: e => store.putEdge(e),
    removeEdge: id => store.removeEdge(id),
    neighbours: (id, opts) => store.neighbours(id, opts),
    search: opts => query.search(opts),
    traverse: opts => query.traverse(opts),
    hybrid: opts => query.hybrid(opts),
    stats: () => store.stats(),
    close: () => store.close()
  };
}

;

export { createKG, SQLiteStore, MemoryStore, openStore, KGQuery, KGIngest };
export * from './canonical.js';
