# Orchestrate — Reference

## Loop
1. Load `orchestrator/board.json`.
2. Reconcile against `orchestrator/comms/loop-state.json`.
3. Dispatch unclaimed items up to `maxParallel`.
4. Write `orchestrator/comms/_wip/dispatch.json` (transient).
5. Append `orchestrator/comms/comms-log.jsonl`.

## Reconcile output
`{ ok, orphans, duplicates, staleClaims }`. If `ok: false`, do not dispatch.

## Bibliography
- Kubernetes Scheduler design docs.
- Lamport, L. (1978). *Time, Clocks, and the Ordering of Events.*
