# skill: mateam

## When to use
Coordinating two or more agents on a shared item.

## Inputs
- `item` — the sprint item.
- `participants` — 2+ agent ids.
- `roles` — mapping `agent → role`.

## Outputs
- `plan` — handoff sequence with explicit `HANDOFF` blocks.
- `deadlocks` — any pair of agents that could block each other.

## Rules
- Handoffs must be one-directional per step.
- The last step must return control to the coordinator.
- No agent may be assigned two roles in the same step.
