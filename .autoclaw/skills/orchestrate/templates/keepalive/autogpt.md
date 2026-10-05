# Keepalive — AutoGPT

- Bound the agent loop explicitly; unbounded loops corrupt state.
- Persist partial progress to `comms/comms-log.jsonl` every iteration.
- On exception, stop the loop and write an `error` entry — do not retry inline.
