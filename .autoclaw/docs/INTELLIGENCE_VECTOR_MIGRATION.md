# Intelligence Vector Migration

AutoClaw treats the vector database as a rebuildable projection, not as the
durable home for project knowledge.

Durable Intelligence state lives in:

- `.autoclaw/vector/config.json` for the selected provider/model/dimension and
  source toggles.
- `.autoclaw/vector/preferences.json` for learned preferences and avoided
  patterns.
- `.autoclaw/learnings/` and `MEMORY.md` when present for durable learning
  notes.
- `.autoclaw/kg/` for knowledge graph facts.
- Source-adapter watermarks and raw session stores for re-ingestion.

The vector store at `.autoclaw/vector/db.sqlite` can be rebuilt from those
sources. It should be backed up before destructive recovery, but it should not
be the only copy of useful session or learning data.

## Why Indexes Can Become Stale

Embedding vectors only compare correctly when they share one geometry:

- same provider class
- same model
- same vector dimension
- same project namespace

If a project was indexed with one embedding signature and then opened with a
different signature, old cosine scores are not meaningful. AutoClaw marks the
index stale instead of pretending those mixed vectors are valid.

3.6.15 exposed this more often because projects that had an explicit Ollama pin
could still be opened by a read path seeded with the default offline model. The
store then looked like it had crossed from `nomic-embed-text` to
`Xenova/nomic-embed-text-v1.5`, even when the intended provider was still
Ollama. Current read paths must apply the persisted embedding pin before opening
the vector database.

## Migration Rules

Use these rules for every provider, model, dimension, or backend upgrade.

1. Read the saved embedding pin before opening the database.
2. Compare the stored signature with the active signature.
3. If signatures match, keep using the existing vector rows.
4. If only metadata is stale because a resolver default changed, repair the
   metadata to the saved explicit pin before declaring the index corrupt.
5. If the embedding geometry truly changed, keep the old database as a backup
   and rebuild vectors from durable sources.
6. Do not clear recovery state until both code vectors and learned-memory
   vectors have been restored.
7. If a real provider fails during rebuild, mark the index stale and retry
   later instead of silently mixing fallback vectors into the same corpus.

## Safe Upgrade Flow

For a project update that changes vector behavior:

1. Write or preserve `.autoclaw/vector/config.json` with the intended
   provider/model/dimension.
2. Save the previous vector files under a timestamped backup directory before
   replacing `db.sqlite`.
3. Run a full code re-index with the resolved concrete provider.
4. Run `/learn` to rebuild learning vectors from sessions, preferences, and
   graph facts.
5. Verify `.autoclaw/vector/index-health.json` reports:
   - `staleIndex: false`
   - `embeddingDegraded: false`
   - `lastRun.cancelled: false`
6. Clear `db-recovered.json` only after the healthy code index and learning pass
   both complete.

## User-Facing Recovery Guidance

When AutoClaw reports that a vector backend was reset or recovered:

- It means retrieval vectors were rebuilt or need rebuilding.
- It should not mean learned preferences, session history, or graph facts were
  deleted.
- Run `Index codebase`, then run `Learn`, and check Intelligence Health.
- If the provider is Ollama or Router, fix the provider before forcing a
  rebuild. A rebuild with an unhealthy provider would otherwise replace useful
  vectors with low-quality fallback vectors.

## Release Checklist

Before shipping an Intelligence storage change:

- Add a regression for model-pin application on read paths.
- Add a regression for recovered DBs forcing a full code rebuild.
- Add a regression that durable learning artifacts keep recovery state until
  `/learn` succeeds.
- Add a regression for transient provider failures that should retry.
- Run focused Intelligence tests and `npm run compile`.
