# vector/

Dense embeddings + per-agent preferences. Store: `db.sqlite`.
One row per `(owner, key)` pair. Vectors are stored as BLOBs (Float32 LE).

## Tables
| Table | Purpose |
|---|---|
| `embeddings` | (owner, key) → vector blob + dim + model + metadata JSON |
| `preferences` | (owner, key) → JSON value |

## Notes
- `dim` must match `config.json#dim` (default 1024).
- Cosine search is done in-app after a `SELECT` — the DB is a store, not a search index.
- Swap in a real vector DB by re-implementing `bin/vector.js`.
