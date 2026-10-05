# agents/

The runtime that binds the **11 registry agents** to their skill chains.

The catalogue lives in `registry/` and declares *what* each agent is (role,
model, data class, HITL level, capabilities). This module adds *how* it runs:
an ordered chain of skills, a merge into one output, and an escalation rule.
A catalogue entry alone implies no code — an agent with no chain still fails
loudly at `invoke()`.

## Layout
| File | Purpose |
|---|---|
| `index.js` | barrel + `createRuntime()` |
| `runtime.js` | `AgentRuntime` — binds a registry to skill implementations |
| `base.js` | `BaseAgent` — runs one chain, emits `start` / `step:error` / `end` |
| `chains.js` | `CHAINS` — per-agent skill ids + merge + escalation rule |
| `router.js` | `route(task)` / `dispatch(runtime, task)` / `dispatchStrict` |
| `context.js` | `buildContext()` — logger, span, runId, chain outputs |
| `constants.js` | `AGENT_STATE`, `AGENT_PHASE`, `AGENT_OUTCOME` |
| `errors.js` | `UnknownAgentError`, `MissingSkillError`, `ChainEmptyError`, … |

## The 11 agents
| Agent | Role | HITL | Chain | Escalates on |
|---|---|---|---|---|
| `issue-spotter` | analyst | 0 | `issue.extract → issue.rank` | empty output |
| `rule-finder` | retriever | 0 | `rule.lookup → rule.synthesize` | empty output |
| `precedent-analyst` | analyst | 1 | `precedent.retrieve → precedent.compare` | empty output |
| `statute-interpreter` | analyst | 1 | `rule.lookup → application.map` | empty output |
| `citation-validator` | validator | 1 | `validate.citation → validate.consistency` | never |
| `drafter` | writer | 2 | `draft.compose → conclusion.write` | empty output |
| `devil-advocate` | analyst | 1 | `argument.construct → validate.logic` | never |
| `risk-scorer` | analyst | 1 | `risk.assess → risk.quantify` | empty output |
| `summariser` | writer | 1 | `summarize.long` | empty output |
| `translator-ms` | writer | 1 | `translate.en-ms` | never |
| `qa-reviewer` | reviewer | 2 | `validate.consistency → validate.citation → validate.logic` | never |

Validators use `escalate: 'never'` because an abstain vote is a valid answer,
not an escalation. `qa-reviewer` is **minority-veto**: any `no` blocks the pass,
and the reported confidence is the lowest of the three reviewers.

## Usage
```js
const { createRuntime, dispatch } = require('./agents');

const runtime = createRuntime({
  skills: {
    'issue.extract': async ({ query }) => ({ issues: [query] }),
    'issue.rank':    async ({ issues }, ctx) => ({ issues: ctx.prev.issues })
  }
});

await runtime.invoke('issue-spotter', { query: 'unfair dismissal?' });
await dispatch(runtime, { input: { q: 'unfair' } });            // → rule-finder
await dispatch(runtime, { input: { proposal: 'See [R1]' } });   // → citation-validator
```

Pass a private `registry` (`new Registry()`) when a process creates more than
one runtime: `defaultRegistry` refuses to re-bind an impl, and a stale binding
from an earlier runtime would answer for the newer one.

## Agent report
Every invocation returns the same shape:
```js
{
  agent:        'issue-spotter',
  role:         'analyst',
  outcome:      'ok' | 'failed' | 'escalate',
  reason:       null | 'empty-output' | '<the failed skill message>',
  steps:        [{ skill, ok, ms, reason? }, …],
  output:       { issues: [...] },          // the chain merge
  ms:           12,
  invocationId: 'inv_1_m1a2b3',
  runId:        'run_1_m1a2b3'
}
```

## Skill contract
A skill is `(input, ctx) => output`. `input` is the caller's input, unchanged —
it is not rewritten by earlier steps, so each skill keeps its own declared
input contract. Chain state arrives on `ctx`:

| Field | Meaning |
|---|---|
| `ctx.prev` | the immediately preceding step's output |
| `ctx.outputs` | every completed step's output, keyed by skill id |
| `ctx.agent` | `{ id, role, model }` |
| `ctx.logger` / `ctx.span` | child logger and the invocation span |
| `ctx.deps` | whatever the runtime was constructed with |
| `ctx.report(event)` | progress callback |

`steps[].reason === 'no-implementation'` means the skill has no implementation.
That does not abort the chain — if the merge is still usable the outcome is
`ok`, and if it is empty the outcome is `escalate` with `empty-output`.

## Registry integration
`runtime.get(id)` also calls `registry.registerAgentImpl(id, …)`, so a consumer
holding only the registry — `registry.getAgent(id).invoke(payload)` — routes
through this runtime instead of failing with `NOT_IMPLEMENTED`. Binding is
best-effort: a registry that already holds an impl keeps it.

## Adding an agent
1. Add the catalogue row in `registry/` (id, skill, model, role, dataClass, hitlLevel, capabilities).
2. Add one `CHAINS` entry in `chains.js`.
3. Implement the skills, or leave them unwired — an unwired agent escalates
   with `empty-output` rather than lying about success.

`runtime.listMeta()` then reports it, and `node bin/agents.js list` shows it.

## CLI
```bash
npm run agents                                  # the table
npm run agents:show -- issue-spotter            # meta + chain
npm run agents:invoke -- issue-spotter '{"query":"Was this unfair?"}'
npm run agents:route -- '{"input":{"q":"unfair"}}'
npm run agents:types                            # task.type → agent
```