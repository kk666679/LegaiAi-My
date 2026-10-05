# dataset/

Golden fixtures + evaluation corpus. Every `.jsonl` line is one record.

| Folder | Purpose |
|---|---|
| `seed/` | KG seed nodes + edges |
| `cases/` | End-to-end workflow cases (`irac`, `ask`) |
| `skills/` | Per-skill behavior cases |
| `consensus/` | Ballot scenarios |
| `i18n/` | Language detection cases |

## Usage
```js
const ds = require('./dataset');
const all = ds.loadAll();
const r = ds.validate();
// { ok: true, problems: [], counts: { seed: {...}, cases: {...}, ... } }
```

## CLI
```bash
npm run dataset          # validate, exits 1 on problems
node bin/dataset.js list
node bin/dataset.js counts
```

Self-contained by design: `dataset/index.js` has no cross-module dependency,
so an evaluation harness can load it without pulling in the rest of the tree.
