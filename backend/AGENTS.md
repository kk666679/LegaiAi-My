# Backend — Agent Instructions

<!-- intent-skills:start -->
## Skill Loading

Before substantial work:
- Skill check: run `npx @tanstack/intent@latest list`, or use skills already listed in context.
- Skill guidance: if one local skill clearly matches the task, run `npx @tanstack/intent@latest load LegalAi-My#<skill>` and follow the returned `SKILL.md`.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Three agent subsystems — read the right one

This repo runs three distinct agent subsystems side by side. They are **junctions**
(`.openclaw/`, `.autoclaw/`, `.clinerules/` at the workspace root) — not copies.
Any reference to one resolves to the workspace-root file. **Do not edit through
the junction if you didn't mean to; edit at the root.**

| Subsystem | Owns | Source of truth | Read when… |
|---|---|---|---|
| **OpenClaw** | 12 legal domain agents + 16 specialists, skills, rules, datasets | `../.openclaw/` | you're implementing a legal skill, agent, rule, or dataset (`.openclaw/agents/`, `.openclaw/skills/`, `.openclaw/rules/`, `.openclaw/datasets/`) |
| **AutoClaw** | Coordination, memory, vector store, KG, comms inboxes, KDream, sprint board | `../.autoclaw/` | you're coordinating with other agents (Kiro, kilocode), claiming a task, voting on consensus, or querying `/learn`, `/index-code`, `/retrieve`, `/search`, `/metrics` |
| **Cline Rules** | Host-loaded assistant rules (Cline/Roo/Kiro modes) | `../.clinerules/` | you need the canonical operating rules for a given mode (orchestrate, kdream, mateam, intelligence, autobuild, doc-writer, security-auditor) — these auto-load in those hosts |

**Always-active rule** (from `.clinerules/cross-agent-protocol.md`): before any task,
check `.autoclaw/orchestrator/comms/inboxes/kilocode/` and `…/inboxes/shared/`.
On completion, broadcast `task_complete` then send `review_request` to peers.
Consensus: 2/3 majority normally, **unanimous for security findings**.

## Backend-specific notes

- tRPC routers live in `src/trpc/`; tool schemas in `src/tools/index.ts`
- BullMQ workers are in `../workers/` (workspace root)
- Prisma schema: `prisma/schema.prisma`
- For legal domain skills, load from workspace root: `npx @tanstack/intent@latest load LegalAi-My#<skill>`

## Conventions (apply across the three subsystems)

1. **File tools, not shell**, for directories and files. Do not use `mkdir -p`, `touch`, or `New-Item` in agent-driven flows.
2. **Forward slashes** in all paths.
3. **Idempotency**: re-running a setup command against an existing directory updates in place; do not blow it away.
4. **Citations**: always `[YYYY] N MLJ NNN` format.
5. **PII**: call `legal_privacy` (redact) before any LLM call or indexing.
6. **Validation gate**: call `legal_validate` before `legal_draft` when citations are supplied.
7. **Credibility gate**: `credibilityScore < 90` blocks drafting in production.
8. **Ethics notice**: always append to legal advice responses.
9. **Never invent** files, sessions, learnings, citations, case names, or holdings.
10. **Output discipline**: confirm in ≤5 lines — what changed, what file, next action.

## Cross-reference map

```
backend/                           ← you are here
├─ src/                            tRPC, tools, server
├─ prisma/                         schema
└─ (junctions, see table above)    ../.openclaw   ../.autoclaw   ../.clinerules

workspace root
├─ app/                            Next.js 16
├─ workers/                        12 BullMQ workers
├─ prisma.config.ts
├─ AGENTS.md                       root agent index
├─ SKILL.md                        @tanstack/intent packaged skill (all 12 legal skills)
└─ .openclaw/  .autoclaw/  .clinerules/   ← source of truth for the three subsystems
```

## When in doubt

- Legal domain question → `.openclaw/AGENTS.md` + `.openclaw/skills/<name>.SKILL.md`
- Multi-agent coordination → `.autoclaw/AGENT-ORIENTATION.md` + `.clinerules/cross-agent-protocol.md`
- Mode-specific operating rules → `.clinerules/<mode>.md` (orchestrate, kdream, mateam, intelligence, autobuild, doc-writer, security-auditor)
- Backend wiring → this file
