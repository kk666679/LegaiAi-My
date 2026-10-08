# skill: intelligence

## When to use
Converting raw retrieved material into structured claims for downstream
reasoning.

## Inputs
- `sources` — array of nodes or documents.
- `question` — the point of interest.

## Outputs
- `claims` — array of `{ text, supports: [sourceId], confidence }`.

## Rules
- Every claim must cite at least one `sourceId`.
- Confidence is a self-reported scalar in [0, 1] and must reflect source
  strength, not stylistic polish.
- If fewer than half the claims can be sourced, return `{ insufficient: true }`.
