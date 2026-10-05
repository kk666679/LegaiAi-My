# Outboxes — doc-writer

Message envelopes for `revive`, per spec revive.6. This agent uses
`loop_mechanism: plain-message`, so the rendered keepalive prompt is delivered
directly in the user-facing output and **nothing** is written here or to
`ready` by the orchestrator.

This directory is provisioned for parity with the `cli-headless` agents and
for bridge-relayed transport (`loop_mechanism: bridge-relayed`), where the
OpenClaw HTTP bridge picks envelopes up instead.

Envelope shape is identical to the other agents' outboxes. See
`../../hermes/outboxes/README.md`.