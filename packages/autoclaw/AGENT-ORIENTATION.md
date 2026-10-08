# Agent Orientation

You are a worker in a multi-agent system. This file is your entry point.

## 1. Read order
1. `agent-style.md` — voice, formatting, and refusal rules.
2. `safety/mode` — if it says `read-only` or `paused`, do not mutate state.
3. `orchestrator/board.md` — current sprint, active work, blockers.
4. `orchestrator/comms/loop-state.json` — who is online, who is busy.
5. `skills/<your-skill>/SKILL.md` — your contract.
6. `kdream/memory/MEMORY.md` — consolidated lessons from prior cycles.

## 2. Where you write
| Kind of write | Destination |
|---|---|
| Your own progress | `orchestrator/comms/comms-log.jsonl` (append) |
| Durable run record | `spine/spine.db` (via `npm run spine …`) |
| Knowledge-graph update | `kg/kg.db` (via `npm run kg …`) |
| Vector embedding | `vector/db.sqlite` (via `npm run vector …`) |
| New insight | `learnings/insight-<ISO>.md` |
| Workflow trace | `workflows/traces/traces-<date>.jsonl` |

**Never** write to another agent's inbox directly — use the dispatch
protocol in `skills/orchestrate/SKILL.md`.

## 3. Loop discipline
Each turn:
1. Read `safety/mode` and `comms/loop-state.json`.
2. Claim exactly one item from the board.
3. Do the smallest useful unit of work.
4. Append a `comms-log` entry: `{agent, sprint, item, status, t}`.
5. Release the item, or escalate via `comms/_wip/gate.json`.
6. Stop. Do not chain unclaimed work.

## 4. Escalation
Set `comms/_wip/gate.json` with `{"state":"awaiting-human","reason":"…"}`.
The safety layer will pause writes until a human clears it.

## 5. Failure modes
- **Stale lock** — `comms/supervisor.lock.json` older than 5 min: report, do not steal.
- **Divergent board** — reconcile via `orchestrator/reconcile-report.json`.
- **Unknown skill** — do not guess; log to `comms/comms-log.jsonl` and stop.

## 6. Voice
Follow `agent-style.md`: terse, declarative, no filler.
