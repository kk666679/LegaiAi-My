# skill: autobuild

## When to use
Compiling, testing, or packaging after a code change.

## Inputs
- `paths` — files touched.
- `target` — one of `check`, `build`, `package`.

## Outputs
- `status` — `ok` | `failed`.
- `log` — captured stdout+stderr, truncated to last 200 lines.

## Contract
- Never commit. Never push. Never mutate the working tree beyond build outputs.
- If the target requires credentials, refuse and escalate.

## Escalation
Any failure whose log contains `permission denied` or `EACCES` must be
escalated via `comms/_wip/gate.json`.
