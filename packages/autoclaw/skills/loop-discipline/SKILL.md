# skill: loop-discipline

## Rule
Each agent turn does exactly one unit of work, then stops.

## Turn shape
1. Read `safety/mode` and `comms/loop-state.json`.
2. Confirm your item is still assigned to you.
3. Perform the work — nothing more.
4. Append one `comms-log` line.
5. Update `loop-state.json` for your agent.
6. Release or escalate.

## Forbidden
- Chaining unclaimed work.
- Editing another agent's files.
- Writing to `comms/inboxes/` directly.
- Running more than one dream cycle per hour without human approval.
