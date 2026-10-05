# Join an existing sprint

1. Add yourself to `comms/registry.json`.
2. Add a `loop-state.json` entry: `{ state: "idle", item: null }`.
3. Read the current board and the last 50 `comms-log.jsonl` lines.
4. Claim one item from `board.json#items` whose `status == "todo"`.
5. Announce in `comms/comms-log.jsonl`: `{"kind":"join", ...}`.
