# Logs

Execution logs. Written by the orchestrator loop and by worker runs.

Durable run records do **not** belong here — those go to the spine
(`spine/spine.db`, via `npm run spine`). This directory holds human-readable
and machine-readable traces of orchestration activity that is not a durable
run record:

- per-agent loop output and stall diagnostics
- gate command stdout/stderr captured during review
- dispatch and revive transcripts

For per-span workflow timing, see `workflows/traces/traces-<date>.jsonl`.
For the append-only agent activity stream, see
`orchestrator/comms/comms-log.jsonl`.