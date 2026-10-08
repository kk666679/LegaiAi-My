# Keepalive — Hermes

- Read-only against `kg/`. Never mutate on the hot path.
- Cache warm-start queries in `vector/preferences.json`.
- If budget is exhausted mid-query, return partial findings with a `used` count.
