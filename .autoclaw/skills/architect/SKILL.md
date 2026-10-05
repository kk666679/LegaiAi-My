# skill: architect

## When to use
Designing a workflow, decomposing a sprint item, or reviewing a proposal
for structural correctness (not domain correctness).

## Inputs
- `objective` — one sentence.
- `constraints` — list of hard limits (time, tokens, safety).
- `context` — relevant nodes from `kg/`.

## Outputs
- `plan` — ordered list of steps, each with a `skill` and `inputs`.
- `risks` — ranked list with `{ risk, mitigation }`.

## Method
1. Restate the objective in your own words. If ambiguous, stop and escalate.
2. Enumerate the smallest steps that can be done independently.
3. For each step, name the skill that will do it.
4. Identify the two most likely failure modes; propose mitigations.

## Anti-patterns
- Planning more than one sprint ahead.
- Inventing skills that do not exist in `skills/`.
- Silent scope expansion.

## See also
- `bibliography.md` — reference material for design patterns.
