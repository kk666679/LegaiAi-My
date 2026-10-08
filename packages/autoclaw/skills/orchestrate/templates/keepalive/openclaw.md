# Keepalive — OpenClaw

- File-backed queues only; never write to `inboxes/shared` directly.
- Move processed envelopes to `inboxes/_archive/`.
- If the supervisor lock is stale (>5 min), report — do not recover.
