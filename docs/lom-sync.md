---
title: LOM Sync & Law Maintenance
id: lom-sync
order: 10
---

# LAW MATE — LOM (Laws of Malaysia) Sync

Scripts under `scripts/lom-*.mjs` keep the local corpus in sync with the official *Laws of Malaysia* (LOM) source PDFs. The sync is one-way (source → DB) and idempotent.

See [deployment.md](deployment.md#database-operations) for general Prisma operations.

---

## Quick reference

| Script | Purpose |
|--------|---------|
| `npm run lom:sync` | Sync all LOM sections |
| `npm run lom:sync:principal` | Principal Acts only |
| `npm run lom:sync:amendments` | Amendment Acts |
| `npm run lom:sync:pu-a` | Perintah Undang-Undang (PU(A)) |
| `npm run lom:sync:pu-b` | Perintah Undang-Undang (PU(B)) |
| `npm run lom:sync:constitution` | Federal Constitution |
| `npm run lom:index` | Alias for `lom:sync` — also reindexes the vector store |
| `npm run lom:validate` | Run citation-validator unit tests |
| `npm run lom:monitor` | Run sync across all sources (monitoring mode) |
| `npm run lom:health` | Print corpus health summary (counts, last sync, drift) |

---

## Typical workflow

```bash
# 1. Sync statutes and amendments
npm run lom:sync

# 2. Validate newly ingested citations parse and resolve
npm run lom:validate

# 3. Re-embed any new/changed documents into pgVector
npm run lom:index

# 4. Sanity check corpus state
npm run lom:health
```

---

## Storage & performance notes

- Source PDFs are downloaded to `data/lom/` (gitignored).
- Embedding uses `EMBED_MODEL` (default `mxbai-embed-large`) — first run downloads ~600MB.
- Each `lom:sync:*` invocation is independent; safe to run in parallel against different subcommands.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `lom:sync` hangs on download | Network/firewall | Configure `LOM_HTTP_PROXY` or pre-stage PDFs in `data/lom/` |
| Embeddings fail with OOM | System memory < 4 GB | Run `lom:sync:constitution` and `lom:sync:amendments` separately |
| `lom:validate` reports malformed citations | Source PDF is scanned/image-only | Re-run OCR pipeline (`scripts/patch-ag-ui-core.mjs` is unrelated — see `scripts/lom-ocr.mjs` if present) |