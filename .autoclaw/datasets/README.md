# dataset/

Golden fixtures + evaluation corpus. Every `.jsonl` line is one record.

| Folder | Purpose |
|---|---|
| `seed/` | KG seed nodes + edges |
| `cases/` | End-to-end workflow cases (`irac`, `ask`) |
| `skills/` | Per-skill behavior cases |
| `consensus/` | Ballot scenarios |
| `i18n/` | Language detection cases |
| `asean/` | ASEAN jurisdiction metadata and treaty records |

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

## ASEAN coverage

The `asean/` group contains:

| File | Purpose |
|------|---------|
| `schema.json` | JSON Schema for jurisdiction records |
| `jurisdictions.jsonl` | One record per ASEAN member state + Timor-Leste |
| `treaties.jsonl` | ASEAN treaties, agreements, conventions, protocols |

ASEAN `cases/` and `skills/` files extend evaluation coverage for:
- Cross-jurisdiction retrieval (`cases/asean-ask.jsonl`)
- ASEAN legal reasoning (`cases/asean-irac.jsonl`)
- Jurisdiction-specific retrieval validation (`skills/asean-jurisdiction-retrieval.jsonl`)
