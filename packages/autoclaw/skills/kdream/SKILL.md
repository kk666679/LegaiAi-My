# skill: kdream

## When to use
Running a knowledge-graph consolidation cycle during idle time.

## Inputs
- `mode` — `light` | `deep` | `rem` | `focused`.
- `dryRun` — boolean (default `true` — always preview first).

## Outputs
- `report` — per-phase counts `{ replay, consolidate, prune, enrich, reflect }`.

## Modes
| Mode | Phases |
|---|---|
| light   | replay + prune |
| deep    | replay + consolidate + prune + enrich |
| rem     | replay + enrich + reflect |
| focused | replay + reflect |

## Rules
- Always run `dryRun: true` first. Inspect the report.
- Never exceed policy ceilings (`maxMergesPerCycle: 50`, `maxPrunesPerCycle: 200`).
- After a real cycle, append an insight to `learnings/` if anything
  unexpected surfaced.
