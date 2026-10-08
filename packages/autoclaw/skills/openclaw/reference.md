# OpenClaw — Reference

## Rules
- Never delete from `orchestrator/comms/inboxes/shared`. Move to `inboxes/_archive/`.
- If the supervisor lock is held by someone else, do not poll.
- Channel paths must resolve under `orchestrator/comms/inboxes/`.

## Envelope shape
`{ id, from, to, kind, body, sentAt }`

## Bibliography
- Fielding, R. (2000). *Architectural Styles and the Design of Network-based Software Architectures.*
