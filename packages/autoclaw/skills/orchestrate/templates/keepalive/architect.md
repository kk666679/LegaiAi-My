# Keepalive — Architect

- Planning only. Never execute worker tasks.
- Re-read `orchestrator/board.md` and `state.json` before resuming.
- If the objective is ambiguous, escalate instead of assuming a scope.
- Respect scope isolation: never assign overlapping globs to parallel agents.
- When stalled mid-plan, persist partial DAG level assignment to
  `orchestrator/logs/` so the next pass does not restart from zero.