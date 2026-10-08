# .autoclaw/

A multi-agent orchestration substrate: a self-hosted knowledge graph, a
spine of durable run records, a vector store, a dream cycle, a
human-in-the-loop safety layer, and a portable skill library.

## Layout
| Folder | Role |
|---|---|
| `orchestrator/` | Sprint board, agent comms bus, audit trail, supervisors |
| `skills/` | Portable skill library — one folder per skill, five-file envelope |
| `registry/` | Agent / model / skill catalogue (declarative, no implementations) |
| `agents/` | Runtime binding catalogue agents to ordered skill chains |
| `kg/` | Knowledge graph: store, query, ingest, `createKG()` |
| `kgdream/` | Graph consolidation cycle (replay, consolidate, prune, enrich, reflect) |
| `kdream/` | Memory consolidation cycle → `kdream/memory/MEMORY.md` |
| `spine/` | SQLite durable run spine (events, decisions, milestones) |
| `vector/` | SQLite vector store (embeddings + preferences) |
| `learnings/` | Immutable insight notes — one file per insight |
| `metrics/` | Effectiveness + token metrics (rolling snapshots) |
| `observability/` | Logger, metrics, tracer — injectable sinks, no exporter |
| `autobuild/` | Scheduler heartbeat |
| `safety/` | Operational mode file (kill switch) |
| `workflows/` | Trace logs (JSONL, one file per day) |
| `test/` | `node:test` suites, one per module |
| `bin/` | Node CLI helpers — the only executable surface |

> **No shell scripts.** Every command in this project is a `.js` file run by
> Node. `.sh` files are never written or invoked.

## Skill envelope
Every folder in `skills/` carries `SKILL.md` (prose), `skill.json` (machine
contract), `golden.jsonl` (executable cases), `eval.json` (metrics, thresholds,
judge) and `reference.md` (patterns, glossary, bibliography). `node bin/skills.js
validate` is the gate.

## Quickstart
```bash
npm run init         # create SQLite stores from schemas
npm run check        # required files + every JSON/JSONL parses
npm run test         # every *.test.js under test/
npm run board        # render orchestrator/board.md from board.json
npm run heartbeat    # touch autobuild/scheduler-heartbeat.json
npm run gc           # garbage-collect comms/_wip + _gc
npm run dream        # memory consolidation cycle (kdream)
npm run kgdream      # graph consolidation cycle
npm run skills       # skill envelope table
npm run agents       # agent / chain table
npm run clean        # remove stores
npm run help         # list every script
```

See `AGENT-ORIENTATION.md` for the operating model.
