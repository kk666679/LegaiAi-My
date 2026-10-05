# kgdream/

Background KG consolidation cycle.

| Mode | Phases |
|---|---|
| `light` | replay + prune |
| `deep` | replay + consolidate + prune + enrich |
| `rem` | replay + enrich + reflect |
| `focused` | replay + reflect |

## Usage
```js
const { Dreamer, Policy } = require('./kgdream');
const dreamer = new Dreamer({ store, policy: new Policy({ dryRun: true }) });
const report = await dreamer.runCycle({ mode: 'deep' });
// { cycleId, mode, ok, ms, dreamSetSize, phases: [{ name, ok, ... }, …] }
```

## Store contract
Phases call only the methods that exist, so a partial store degrades rather
than crashes; a phase needing a missing method returns `{ ok: false, notes }`.

- `listNodes({ limit })` / `search({ q, k })`
- `getNode(id)`
- `neighbours(id, { limit })` — entries carry `weight`; the edge identity may be
  `edgeId` (neighbour node plus its edge) or `id` (the edge itself). `prune`
  accepts both.
- `upsert(node)`, `removeNode(id)`
- `putEdge(edge)`, `removeEdge(id)`

## Guardrails
`policies.js` clamps every phase to a ceiling (`maxMergesPerCycle: 50`,
`maxPrunesPerCycle: 200`, …). `dryRun: true` previews without mutating.
