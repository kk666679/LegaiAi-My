# Architect — Reference

## Patterns
- **Sprint decomposition** — every step must be claimable by exactly one agent.
- **Dependency discipline** — a step may depend on at most two predecessors.
- **Reversibility** — prefer plans whose middle steps can be rolled back independently.
- **Failure surfaces** — name them explicitly; silent failure is worse than loud failure.
- **Budget** — allocate tokens per step; if unallocated, the plan is incomplete.

## Glossary
- **Step** — atomic unit assignable to exactly one skill.
- **Handoff** — transfer of one item between agents.
- **Reversibility** — the ability to roll back a step without affecting siblings.

## Bibliography
- Parnas, D. L. (1972). *On the criteria to be used in decomposing systems into modules.*
- Brooks, F. P. (1975). *The Mythical Man-Month.*
- Larman, C. & Vodde, B. (2016). *Large-Scale Scrum.*
