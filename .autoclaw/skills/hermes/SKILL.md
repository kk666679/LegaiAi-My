# skill: hermes

## When to use
General-purpose retrieval and multi-step research tasks.

## Inputs
- `query` — one line.
- `budget` — max tool calls (default 6).

## Outputs
- `findings` — ranked list `{ nodeId, title, why }`.
- `used` — number of tool calls spent.

## Method
1. Query the KG. If < 3 hits, broaden once, then stop.
2. For the top 3 hits, expand one hop.
3. Deduplicate by canonical key.
4. Rank by (score × recency).

## Rules
- Never fabricate node ids. If no hits, return `{ findings: [], used: N }`.
- Never exceed `budget`.
- Never write to `kg/kg.db` — Hermes reads only. Consolidation is a
  separate phase (`kdream`).
