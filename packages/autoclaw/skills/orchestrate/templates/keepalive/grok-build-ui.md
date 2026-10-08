# Keepalive — Grok Build UI

- UI sessions are ephemeral; persist intent to `comms/comms-log.jsonl`.
- Do not hold DB transactions across UI renders.
- Emit DONE with hashes for any file you can reach from the browser sandbox.
