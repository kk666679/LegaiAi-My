# skills/

Each skill folder carries six files:

| File | Purpose |
|---|---|
| `SKILL.md` | Human contract (prose) — when to use, method, anti-patterns |
| `skill.json` | Machine contract: id, version, kind, inputs, outputs, triggers, model, tools, escalation, tags |
| `golden.jsonl` | Golden cases — one `{ id, input, expect }` per line |
| `eval.json` | Eval config — metrics, thresholds, judge spec, `minGolden`, severity |
| `reference.md` | Patterns, glossary, bibliography |
| `*` | Anything else is optional (`bibliography.md`, `templates/`) |

`SKILL.md` stays authoritative for prose. The JSON files are a machine *view*
of the same contract — they index it, they do not restate it.

## Loader API
```js
const skills = require('./index');

skills.listSkills();     // ['architect', 'autobuild', …]
skills.loadSkill('hermes'); // { name, dir, meta, golden, eval, skillMd, reference }
skills.loadAll();
skills.validate();       // { ok: true, problems: [] }  — the gate
skills.counts();         // { architect: { golden: 3, kind, model, hasEval, … }, … }
```

`validate()` fails on: a missing required `skill.json` field, an `id` that does
not match the folder name, empty `inputs`/`outputs`/`triggers`/`tags`, an
`escalation.on` without a `via`, fewer golden cases than `eval.minGolden`, a
golden case without `id`/`input`/`expect`, a duplicate case id, or a missing
`eval.json` / `reference.md` / `SKILL.md`.

## Golden-runner API
```js
const { runGolden, runAll, assertExpect } = require('./runner');

const r = await runGolden('hermes', {
  impl: async ({ query, budget }) => ({ status: 'ok', findings: [], used: 1 })
});
// { skill, results: [{ id, status, actual, failures }], summary: { passed, failed, skipped, error, total } }

await runAll({ impls: { hermes: impl, kdream: otherImpl } });
```

`impl` is injected — the runner never imports a skill implementation itself.
Without an `impl` every case reports `skipped`, never `passed`. A skill error
is reported as `status: 'error'` with the message; it is never swallowed as a
pass.

## `expect` grammar
| Key | Meaning |
|---|---|
| `status` | `'ok' \| 'failed' \| 'escalate'` |
| `reason` | required when `status: 'escalate'` |
| `verdict` | `'pass' \| 'block'` |
| `contains` | substring of `JSON.stringify(actual)` |
| `phases` / `actions` | exact array equality with `actual.<key>` |
| `min_<field>` | `actual.<field>` is an array of length >= value |
| `max_<field>` | `actual.<field>` is an array of length <= value |
| `max_used` | `actual.used <= value` |
| `<flag>: true` | `actual.<flag> === true` |

Extending the grammar is one branch in `runner.js:assertExpect`.

## Writing a new envelope
1. Create `skills/<name>/SKILL.md`.
2. Copy `skills/hermes/skill.json` and rewrite the contract fields.
3. Write >= `eval.minGolden` lines into `golden.jsonl` — cover the happy path,
   an escalation path, and a boundary path.
4. Write `eval.json` with `severity: 'block'` for anything safety-critical.
5. Write `reference.md` (patterns, glossary, bibliography).
6. `node bin/skills.js validate` must report `ok: true`.

## CLI
```bash
npm run skills                 # table of every envelope
npm run skills:validate        # the gate — exits non-zero on any problem
node bin/skills.js show hermes # skill.json + eval.json + golden summary
node bin/skills.js golden hermes
node bin/skills.js eval architect
```