# skill: openclaw

## When to use
Interfacing with the OpenClaw runtime — file-backed queues, inbox
watchers, keepalive pings.

## Inputs
- `channel` — inbox path (must be under `comms/inboxes/`).
- `action` — `poll` | `ack` | `requeue`.

## Outputs
- `messages` — array of envelopes (for `poll`).
- `acked` — count.

## Rules
- Never delete from `inboxes/shared`. Move to `inboxes/_archive/`.
- If the supervisor lock is held by someone else, do not poll.
