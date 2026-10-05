# kg/

SQLite knowledge graph. Schema in `schema.sql`, initializer in `init.js`,
read/write wrapper in `bin/kg.js`.

## Tables
| Table | Purpose |
|---|---|
| `nodes` | entities — cases, statutes, concepts, reflections |
| `edges` | relations — cites, discusses, defines, inferred |
| `tags`  | free-form labels on nodes |
| `sources` | external documents backing nodes/edges |

## Contracts
- Every `nodes.id` is stable across ingestion (`case:…`, `statute:…`).
- Edges decay at 0.95 per dream cycle; below 0.15 they are pruned.
- `nodes.canonical` drives duplicate detection during consolidation.
