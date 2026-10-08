# Hermes — Reference

## Method
1. Query the KG. If < 3 hits, broaden once, then stop.
2. For the top 3 hits, expand one hop.
3. Deduplicate by canonical key.
4. Rank by (score × recency).

## Rules
- Never fabricate node ids.
- Never exceed `budget` tool calls.
- **Read-only** against `kg/`. Consolidation belongs to the dream cycle.

## Return shape
`{ findings: [{ nodeId, title, why }], used: N }`. Empty `findings` is
valid — never invent a hit.

## Bibliography
- Manning, C. et al. (2008). *Introduction to Information Retrieval.*
