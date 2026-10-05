# Outboxes — hermes

Message envelopes for `revive`, per spec revive.6. When
`loop_mechanism === "cli-headless"` (this agent), the rendered keepalive
prompt is written here as `<msg-id>.json` and `ready` is touched so a runner
picks it up. Prompt is then `plain-message` delivered.

Envelope shape:

```json
{
  "msg_id": "<unique>",
  "type": "revive",
  "agent": "hermes",
  "stalled_for": "<human readable>",
  "template": "templates/keepalive/hermes.md",
  "rendered_at": "<ISO-8601>",
  "by": "orchestrator",
  "prompt": "<fully rendered template text>"
}
```

Process: write the envelope, then `touch ready`. The runner clears `ready`
after consumption. Do not write here for agents using `plain-message`
delivery — those receive the rendered prompt directly.