# Backend `.claude/` — consolidated agent index

This directory is the single entry point for every AI coding agent working in
`backend/`. It does not duplicate content from the three subsystems; it
**indexes** them and explains how they fit together.

## What lives here vs. at the workspace root

The three subsystems are real source-of-truth directories at the repo root:

- `../.openclaw/` — legal domain agents, skills, rules, datasets
- `../.autoclaw/` — coordination, memory, vector store, KG, inboxes, KDream, sprints
- `../.clinerules/` — host-loaded assistant rules (Cline/Roo/Kiro modes)

They are also accessible as junctions at `backend/.openclaw/`, `backend/.autoclaw/`,
`backend/.clinerules/`, and again here as `backend/.claude/{openclaw,autoclaw,clinerules}/`.
**Edit at the root**; the junctions are read-through views.

## Where to start

| If you are… | Read this first |
|---|---|
| Implementing a legal feature | [`openclaw/AGENTS.md`](./openclaw/AGENTS.md) → relevant `openclaw/skills/*.SKILL.md` |
| Coordinating with other agents | [`autoclaw/AGENT-ORIENTATION.md`](./autoclaw/AGENT-ORIENTATION.md) + [`clinerules/cross-agent-protocol.md`](./clinerules/cross-agent-protocol.md) |
| Running an orchestrated sprint | [`clinerules/orchestrate.md`](./clinerules/orchestrate.md) |
| Using persistent memory / RAG | [`clinerules/intelligence.md`](./clinerules/intelligence.md) + [`clinerules/kdream.md`](./clinerules/kdream.md) |
| Spawning a parallel team | [`clinerules/mateam.md`](./clinerules/mateam.md) |
| Auditing security | [`clinerules/security-auditor.md`](./clinerules/security-auditor.md) |
| Writing docs / changelog | [`clinerules/doc-writer.md`](./clinerules/doc-writer.md) |
| Just touching backend code | [`../AGENTS.md`](../AGENTS.md) |

## Operating rules (apply to all subsystems)

1. **Use file tools, not shell** (`mkdir -p`, `touch`, `New-Item`) for directories.
2. **Forward slashes** in all paths.
3. **Idempotency**: re-running setup against an existing dir updates in place.
4. **Never invent** files, sessions, learnings, citations, case names, or holdings.
5. **≤5 line confirmations**: what changed, what file, next action.
6. **Citations**: `[YYYY] N MLJ NNN`. **PII**: redact via `legal_privacy` before LLM/index.
7. **Validation before draft** when citations supplied. **Credibility gate** at 90.
8. **Append ethics notice** to legal advice responses.
9. **Host safety**: no starting/stopping host services, daemons, containers, or installs.

## On task completion (cross-agent protocol)

1. Broadcast `task_complete` to `.autoclaw/orchestrator/comms/inboxes/shared/`.
2. Send `review_request` to peers' inboxes (Kiro, kilocode, …).
3. Vote on open items in `.autoclaw/orchestrator/comms/consensus/active/`
   (`{task_id}-kilocode-{session_frag}.json`, include full `session_id`).
4. Consensus rule: 2/3 majority normally; **unanimous for security findings**.

## Layout (what is where)

```
backend/.claude/
├─ README.md                      ← this file
├─ openclaw/    (junction)        legal agents, skills, rules, datasets
│  ├─ AGENTS.md                   agent instructions + project map
│  ├─ SKILL.md                    master skill (all 12 legal agents)
│  ├─ KNOWLEDGE.md                Malaysian legal knowledge base 2022-2026
│  ├─ config.yml                  model + skills + tools + channels
│  ├─ agents/                     12 core + 16 specialist (TypeScript)
│  ├─ skills/                     32 SKILL.md files
│  ├─ core/                       runner, registry, orchestrator, memory, tools
│  ├─ rules/                      rule engine (gold-eval, redact-*, …)
│  ├─ datasets/                   gold eval, adversarial, seed data
│  └─ pipeline/                   full case analysis pipeline
├─ autoclaw/    (junction)        coordination + memory + RAG
│  ├─ AGENT-ORIENTATION.md        authoritative orientation (auto-generated)
│  ├─ agent-style.md              learned style guide (READ FIRST)
│  ├─ orchestrator/               sprints, board, inboxes, heartbeats
│  ├─ comms/inboxes/{kilocode,kiro,shared,agents/}
│  ├─ kdream/memory/MEMORY.md     long-lived project memory (append only)
│  ├─ vector/db.sqlite            embeddings (code + learnings)
│  ├─ kg/kg.db                    knowledge graph (coordination facts)
│  ├─ learnings/insight-<ts>.md   distilled sessions
│  └─ metrics/                    token + effectiveness
└─ clinerules/  (junction)        host-loaded rules
   ├─ cross-agent-protocol.md     always active
   ├─ cross-agent.md              canonical for Kilo Code
   ├─ orchestrate.md              sprint planning + review gates
   ├─ autobuild.md                scheduled workflow engine
   ├─ intelligence.md             /learn, /index-code, /retrieve, /search
   ├─ kdream.md                   persistent background agent
   ├─ mateam.md                   spawn Researcher/Coder/Reviewer/Verifier
   ├─ doc-writer.md               docs + CHANGELOG on public-API diff
   └─ security-auditor.md         security findings + GA gate
```

## Safety

Current mode (read `.autoclaw/safety/mode`): **user-in-the-loop** — high-impact
actions require human approval. HITL levels L0–L5 are enforced; L0 = autonomous,
L5 = full human gating. Default is L3 (recommend + confirm).
