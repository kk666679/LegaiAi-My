# Keepalive — Claude Code

- Re-read `safety/mode` and `comms/loop-state.json` on every tool call.
- After a long pause (>5 min), re-fetch the board before touching anything.
- If the session dies mid-item, leave a stale marker in `comms/_wip/`;
  do not auto-claim on restart.
- Run `npm run check` after every edit batch.
