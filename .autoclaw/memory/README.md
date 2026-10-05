# memory/

Two-tier memory: **STM** (short-term, bounded) + **LTM** (long-term, persistent).

| Tier | Scope | Storage | Eviction | Query |
|---|---|---|---|---|
| STM | per-session | in-memory ring buffer | TTL + capacity | recent-N + text score |
| LTM | global | append-only JSONL (`memory/ltm.jsonl`) | salience decay + floor | tag/kind/text score |

Promotion moves repeated or explicit STM items into LTM.

## Layout
| File | Purpose |
|---|---|
| `index.js` | `createMemory()` — the unified facade |
| `stm.js` | `ShortTermMemory` — bounded buffer per session |
| `ltm.js` | `LongTermMemory` — persistent scored store |
| `promotion.js` | STM → LTM promotion strategies |
| `retrieval.js` | `unifiedQuery` — cross-tier ranking |
| `persistence.js` | `JSONLStore` — append, load, compact |
| `constants.js` | `TIER`, `KIND`, defaults |
| `errors.js` | typed errors |

## Usage
```js
const { createMemory } = require('./memory');
const mem = createMemory();

mem.remember('agent-a', { text: 'user asked about unfair dismissal', tags: ['case'] });
mem.remember('agent-a', { text: 'unfair dismissal', tags: ['case'] });

mem.commit({ kind: 'fact', text: 'Employment Act 1955 s.14 governs.', tags: ['statute'], salience: 0.9 });

// unified query
mem.query({ sessionId: 'agent-a', q: 'unfair dismissal', limit: 5 });

// promote repeated STM items
mem.promoteByRepetition({ sessionId: 'agent-a', minOccurrences: 3 });

// decay LTM salience
mem.decay({ factor: 0.95 });
```

## Promotion strategies
| Function | Trigger |
|---|---|
| `promoteEntry(seq)` | promote one specific STM entry |
| `promoteByRepetition({ minOccurrences, windowMs })` | any text appearing >= N times |
| `promoteRecent({ limit })` | flush the N most recent entries |

## Persistence
Every LTM mutation appends a JSONL op:
- `{ op: "commit", entry: {...} }`
- `{ op: "remove", id }`
- `{ op: "access", id, at }`

`createMemory()` hydrates from the log on boot. Call `mem.compact()`
periodically to rewrite the log as one line per live entry.

## Wiring
The MCP/API layers can expose:
- `memory_query` (POST /api/memory/query)
- `memory_remember` (POST /api/memory/remember)
- `memory_commit` (POST /api/memory/commit)
- `memory_promote` (POST /api/memory/promote)
- `memory_decay` (POST /api/memory/decay)
- `memory_stats` (GET /api/memory/stats)
