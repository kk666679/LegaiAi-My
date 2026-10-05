# test/

`node:test` suites for the substrate modules plus `dataset/` and `kgdream/`.
No external test runner — `node:test` and `node:assert` only.

## Run
```bash
npm test                              # all suites via bin/test.js
node bin/test.js test/consensus.test.js   # one file
```

## Coverage
| File | Subject | Tests |
|---|---|---|
| `dataset.test.js`       | fixture loading + validation | 4 |
| `kgdream.test.js`       | dream cycle phases + modes   | 5 |
| `consensus.test.js`     | 5 strategies + error paths  | 8 |
| `registry.test.js`      | catalogue counts, integrity, impl binding | 7 |
| `export.test.js`        | 5 formats + citation refs    | 9 |
| `i18n.test.js`          | EN/MS catalogue + detection  | 5 |
| `hitl.test.js`          | policy triggers + gate + queue | 7 |
| `observability.test.js` | logger + metrics + tracer    | 5 |
| `cache.test.js`         | LRU + TTL + two-tier         | 5 |
| `tasks.test.js`         | enqueue + complete + fail    | 5 |
| `skills.test.js`        | envelopes, validation, golden grammar, runner | 15 |
| `kg.test.js`            | store/query/ingest on both backends + DLQ | 20 |
| `kdream.test.js`        | memory cycle modes, gates, journal, metrics | 20 |
| `agents.test.js`        | chains, escalation, routing, registry binding | 21 |

## Uncovered modules
`mcp/` and `api/` are preflight-gated but have **no** test suite. They are
declaration/transport layers — treat them as unverified.
