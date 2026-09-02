---
title: Tools
id: tools
order: 1
---

# LAW MATE — Tools

LAW MATE uses the [TanStack AI](https://tanstack.com/ai) isomorphic tool system to expose its agent capabilities as type-safe, framework-agnostic tools that can be called from both server (Ollama adapter) and client (React) contexts.

For the per-procedure request/response shapes, see **[agent-api.md](agent-api.md)**. This page covers how tools are *defined and registered* inside the codebase.

---

## Tool registration

All legal tools live in:

- **Schemas + client/server implementations:** `backend/src/tools/index.ts`
- **OpenClaw tool registry:** `.openclaw/tools/` (mirrors the backend tools for the gateway)
- **Skill-level wrappers:** `.openclaw/skills/*.SKILL.md`

A typical definition combines a Zod input/output schema with a `.server()` implementation that delegates to the matching BullMQ worker (see [workers-queues.md](workers-queues.md)):

```typescript
import { toolDefinition } from "@tanstack/ai"
import { z } from "zod"

export const legalRetrieveTool = toolDefinition({
  name: "legal_retrieve",
  description: "Search Malaysian case law by legal issue",
  inputSchema: z.object({
    query: z.string().min(10),
    court: z.enum(["FC", "CA", "HC", "SC", "MC"]).optional(),
    topK: z.number().default(5),
  }),
  outputSchema: z.object({
    cases: z.array(z.object({
      citation: z.string(),
      caseName: z.string(),
      relevanceScore: z.number(),
      status: z.string(),
    })),
  }),
}).server(async ({ query, court, topK }) => {
  const result = await trpcServer.agents.retrieve({ query, court, topK })
  return result
})
```

---

## Tool catalogue

Each row below maps a tool to its tRPC procedure, BullMQ worker, and doc page.

| Tool | tRPC procedure | Worker | Reference |
|------|----------------|--------|-----------|
| `legal_retrieve` | `agents.retrieve` | `legal-retrieval` | [agent-api.md](agent-api.md#agentsretrieve) |
| `legal_analyse` | `agents.analyse` | `legal-analysis` | [agent-api.md](agent-api.md#agentsanalyse) |
| `legal_draft` | `agents.draft` | `legal-drafting` | [agent-api.md](agent-api.md#agentsdraft) |
| `legal_validate` | `agents.validate` | `legal-validation` | [agent-api.md](agent-api.md#agentsvalidate) |
| `legal_debate` | `agents.debate` | `legal-debate` | [agent-api.md](agent-api.md#agentsdebate) |
| `legal_privacy` | `agents.privacy` | `legal-privacy` | [pdpa-compliance.md](pdpa-compliance.md) |
| `legal_audit` | `agents.audit` | `legal-audit` | [pdpa-compliance.md](pdpa-compliance.md) |
| `legal_monitor` | `agents.monitor` | `legal-monitoring` | [openclaw.md](openclaw.md) |
| `legal_index` | `agents.index` | `legal-indexing` | [openclaw.md](openclaw.md) |
| `legal_test` | `agents.test` | `legal-testing` | [openclaw.md](openclaw.md) |
| `legal_orchestrate` | `agents.orchestrate` | `legal-orchestrator` | [agent-api.md](agent-api.md#agentsorchestrate) |
| `legal_sandbox` | `agents.sandbox` | `legal-sandbox` | [deployment.md](deployment.md) |

---

## Adding a new tool

1. Define schema + server impl in `backend/src/tools/index.ts`.
2. Register the matching tRPC procedure in `backend/src/trpc/routers/`.
3. Add the queue + worker under `backend/queues/` and `workers/`.
4. Mirror the tool in `.openclaw/tools/` so the gateway can dispatch to it.
5. Add a slash command (optional) in `.openclaw/commands.yml`.
6. Update [agent-api.md](agent-api.md) and this catalogue.

See [openclaw.md](openclaw.md#adding-a-new-skill) for the full skill/tool wiring checklist.

---

## Framework support

TanStack AI tools are isomorphic — the same `toolDefinition()` schema can be re-implemented with `.client()` for browser-side execution (e.g. optimistic UI updates). LAW MATE currently only uses server implementations; client-side tools are a planned extension.