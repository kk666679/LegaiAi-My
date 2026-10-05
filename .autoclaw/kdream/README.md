# kdream/

Memory consolidation. Reads `learnings/insight-*.md`, promotes the insights the
policy admits, and regenerates `kdream/memory/MEMORY.md`.

> **kdream vs kgdream** — `kgdream/` consolidates the knowledge *graph*
> (replay, consolidate, prune, enrich, reflect over `kg/kg.db`). `kdream/`
> consolidates *memory* (narrative lessons promoted out of `learnings/`).
> Independent: either runs without the other. `bin/dream.js` and
> `bin/kdream.js` drive this one; `bin/kgdream.js` drives the other.

## Modes
Phases are nested, and `reflect` is always last so the rendered file is the
final state of the cycle.

| Mode | Phases |
|---|---|
| `light` | load → promote → reflect |
| `deep` | load → promote → patterns → reflect |
| `full` | load → promote → patterns → archive → reflect |

## Layout
| File | Purpose |
|---|---|
| `index.js` | barrel + `createDreamer()` (default paths under `.autoclaw/`) |
| `dreamer.js` | `Dreamer` — the cycle; `EventEmitter`, emits `phase` / `cycle` |
| `policies.js` | `KdreamPolicy` — promotion gates and ceilings; `clamp()` is the only gate to an acted-on count |
| `buffer.js` | `DreamJournal` — bounded event ring with an injectable sink |
| `metrics.js` | `CycleMetrics` — per-phase runs / ms / ok / failed |
| `memory.js` | `parseInsight` · `listInsights` · `renderMemory` · `read/writeMemory` |
| `patterns.js` | `detectPatterns` (tag recurrence) · `rankInsights` (retention order) |
| `memory/MEMORY.md` | generated artifact — never hand-edit |

## Insight format
```markdown
---
id: insight-2026-08-28T23-16-23-234Z
agent: hermes
sprint: sprint-2026-08-28
tags: [citation, validation]
promoted: true
---

# Insight: cite-check before conclusion

Body…
```

The parser reads flat `key: value` front-matter with inline `[a, b]` lists. No
YAML dependency: the format is owned by this directory, and a lenient parser
that silently mis-reads a tag list would corrupt the promotion gates.

## Usage
```js
const { createDreamer } = require('./kdream');

const dreamer = createDreamer({ stableFacts: ['…'], openQuestions: ['…'] });
const report = await dreamer.runCycle({ mode: 'deep' });
// { cycleId, mode, dryRun, ok, startedAt, finishedAt, ms, phases: [{ name, ms, ok, … }] }

dreamer.isRunning();      // concurrent-cycle guard
dreamer.cycleCount();     // cycles this instance ran
dreamer.readMemory();     // current MEMORY.md, or null
```

## Policy knobs
| Key | Default | Meaning |
|---|---|---|
| `dryRun` | `false` | compute the cycle but do not write `MEMORY.md` |
| `requirePromotedFlag` | `true` | only promote insights with `promoted: true` |
| `promoteTags` | `[]` | additionally require one of these tags |
| `excludeTags` | `['draft']` | never promote insights carrying these |
| `minInsightAgeDays` | `0` | ignore insights newer than N days (off by default) |
| `maxPromotionsPerCycle` | `50` | hard ceiling on promotions |
| `maxArchivesPerCycle` | `100` | hard ceiling on archives |
| `patternMinOccurrences` | `3` | tag recurrence below this is not a pattern |
| `memoryMaxEntries` | `500` | retention target used by the `archive` phase |
| `writeMemoryFile` | `true` | master switch on the filesystem write |

## CLI
```bash
npm run dream             # light cycle (bin/dream.js)
npm run kdream            # light cycle (bin/kdream.js)
npm run kdream:deep
npm run kdream:full
npm run kdream:dry        # full cycle, nothing written
node bin/kdream.js full --json --reason=nightly
```