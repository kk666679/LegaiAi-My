# Loop Discipline — Reference

## Turn shape
1. Read `safety/mode` and `orchestrator/comms/loop-state.json`.
2. Confirm the item is still assigned.
3. Perform exactly one unit of work.
4. Append one `comms-log.jsonl` line.
5. Update `loop-state.json` for your agent.
6. Release or escalate.

## Forbidden
- Chaining unclaimed work.
- Editing another agent's files.
- Writing directly to `orchestrator/comms/inboxes/`.
- Running more than one dream cycle per hour without approval.
