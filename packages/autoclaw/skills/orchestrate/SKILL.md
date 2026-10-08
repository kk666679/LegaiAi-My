# skill: orchestrate

## When to use
Running the loop: allocating items from the board, dispatching to
agents, collecting results, reconciling state.

## Inputs
- `sprint` — board id.
- `maxParallel` — integer.

## Outputs
- `dispatch` — array of `{ agent, item, reason }`.
- `reconcile` — summary `{ ok, orphans, duplicates, staleClaims }`.

## Loop
1. Load `orchestrator/board.json`.
2. Reconcile against `comms/loop-state.json`.
3. Dispatch unclaimed items up to `maxParallel`.
4. Write `comms/_wip/dispatch.json` (transient).
5. Append `comms/comms-log.jsonl`.

## Templates
See `templates/` for signal + review artifacts:
- `completion-signal.md` — how a worker declares done.
- `review-checklist.md` — what a reviewer checks before approving.
- `sprint-assignment.md` — the canonical assignment note.
- `hooks.starter.yaml` — starter config for hook-based dispatch.
- `keepalive/` — per-client keepalive patterns.
- `starter/` — bootstrap notes for a fresh deployment.
