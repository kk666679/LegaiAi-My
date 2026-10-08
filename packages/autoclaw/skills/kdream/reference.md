# Kdream — Reference

> The `kdream` **skill** is the graph consolidation cycle. Its implementation is
> `kgdream/` (`bin/kgdream.js`). Memory consolidation — promoting insights from
> `learnings/` into `kdream/memory/MEMORY.md` — is a different module, also named
> `kdream/`, driven by `bin/dream.js`. Do not confuse the two: this file
> describes the skill, i.e. the cycle over `kg/kg.db`.

## Modes
| Mode | Phases |
|---|---|
| `light`   | replay + prune |
| `deep`    | replay + consolidate + prune + enrich |
| `rem`     | replay + enrich + reflect |
| `focused` | replay + reflect |

The golden cases assert the phase sequence per mode. That sequence is the
contract: a mode that gains or loses a phase is a breaking change.

## Ceilings
Enforced by the policy, not by the phases:
- `maxMergesPerCycle: 50`
- `maxPrunesPerCycle: 200`
- `maxEdgesAddedPerCycle: 300`
- `maxReflectionsPerCycle: 20`

A phase that wants to exceed a ceiling clamps and records the clamp. It never
raises the ceiling itself.

## Rules
- Always run `dryRun: true` first and read the report. Then run for real.
- A phase that throws is recorded and the cycle continues; only a concurrent
  cycle aborts one.
- After a real cycle, append an insight to `learnings/` if anything unexpected
  surfaced.

## Store contract
The cycle works against any store implementing `listNodes`, `getNode`,
`upsert`, `removeNode`, `listEdges`, `getEdge`, `neighbours`, `putEdge`,
`removeEdge`, `search`, `stats`. `kg.createKG().store` satisfies it for both
backends (SQLite and memory), so the cycle is testable without `sqlite3`.

## Bibliography
- McClelland, J. et al. (1995). *Why there are complementary learning systems.*
- Complementary Learning Systems — consolidation as replay, not recomputation.