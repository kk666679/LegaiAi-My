# Intelligence — Reference

## Claim shape
`{ text, supports: [sourceId], confidence: 0..1 }`

## Rules
- Every claim cites ≥1 `sourceId`.
- Confidence reflects source strength, not stylistic polish.
- If fewer than half the claims can be sourced, return `{ insufficient: true }`.

## Failure modes
| Symptom | Fix |
|---|---|
| unsupported claim | drop or mark `insufficient` |
| confidence > 0.9 with one weak source | rescale |
