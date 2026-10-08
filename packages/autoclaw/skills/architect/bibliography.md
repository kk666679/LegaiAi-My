# Architect — reference material

- **Sprint decomposition** — every step must be claimable by exactly one agent.
- **Dependency discipline** — a step may depend on at most two predecessors.
- **Reversibility** — prefer plans whose middle steps can be rolled back independently.
- **Failure surfaces** — name them explicitly; silent failure is worse than loud failure.
- **Budget** — allocate tokens per step; if unallocated, the plan is incomplete.
