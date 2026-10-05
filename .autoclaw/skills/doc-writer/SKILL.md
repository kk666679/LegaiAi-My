# skill: doc-writer

## When to use
Producing prose: memos, summaries, READMEs, commit messages, changelogs.

## Inputs
- `kind` — `memo` | `summary` | `readme` | `commit` | `changelog`.
- `source` — structured input (JSON) or a note.
- `lang` — `en` | `ms` (default `en`).

## Outputs
- `text` — final prose.
- `citations` — array of `{ id, title }` referenced, if any.

## Rules
- Cite only from `source`. If `source` is empty, refuse.
- No first person. No hedging unless the source hedges.
- Match the tone of `agent-style.md`.

## Bilingual
When `lang: ms`, run the output through the MS glossary first, then
submit for validation.
