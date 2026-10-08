# LAWMATE Platform Architecture

LAWMATE is a modular AI infrastructure platform for Malaysian legal practice.
Every major subsystem is an independently installable, versionable, and
publishable `@lawmate/*` package.

## Brand

```
██╗      █████╗ ██╗    ██╗███╗   ███╗ █████╗ ████████╗███████╗
██║     ██╔══██╗██║    ██║████╗ ████║██╔══██╗╚══██╔══╝██╔════╝
██║     ███████║██║ █╗ ██║██╔████╔██║███████║   ██║   █████╗
██║     ██╔══██║██║███╗██║██║╚██╔╝██║██╔══██║   ██║   ██╔══╝
███████╗██║  ██║╚███╔███╔╝██║ ╚═╝ ██║██║  ██║   ██║   ███████╗
╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝     ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝

                 MCP • CLI • AI API GATEWAY
```

## Package Map

| Package | Layer | Responsibility |
|---------|-------|----------------|
| `@lawmate/types` | Foundation | Shared contracts and type definitions |
| `@lawmate/safety` | Governance | Policy engine, authorization, audit, rate limiting |
| `@lawmate/registry` | Governance | Component discovery and version management |
| `@lawmate/adapter` | Integration | Universal adapter/connector layer (LLM, vector, storage) |
| `@lawmate/comms` | Communication | Provider-neutral messaging bus |
| `@lawmate/tools` | Execution | Secure tool execution framework |
| `@lawmate/skills` | Execution | Reusable declarative capabilities |
| `@lawmate/agents` | Intelligence | Agent definitions, lifecycle, and delegation |
| `@lawmate/kg` | Knowledge | Knowledge graph engine |
| `@lawmate/kdream` | Knowledge | Structured knowledge/reasoning representation |
| `@lawmate/vector` | Knowledge | Vector storage and semantic retrieval |
| `@lawmate/memory` | Knowledge | Agent memory with retention policies |
| `@lawmate/evidence` | Knowledge | Evidence and provenance with hash-chain |
| `@lawmate/eval` | Learning | Evaluation framework with metrics and benchmarks |
| `@lawmate/datasets` | Learning | Dataset management and lineage |
| `@lawmate/learning` | Learning | Controlled learning/improvement loop |
| `@lawmate/orchestrator` | Execution | Workflow and agent orchestration |
| `@lawmate/fabric` | Execution | Unified execution fabric |
| `@lawmate/autobuild` | Execution | Build, validation, and packaging |
| `@lawmate/daemon` | Runtime | Long-running local service |
| `@lawmate/cloud` | Runtime | Cloud execution abstraction |
| `@lawmate/mcp` | Interface | Model Context Protocol server |
| `@lawmate/cli` | Interface | Developer command line |
| `@lawmate/gateway` | Interface | Controlled HTTP API |

## Dependency Graph

```
@lawmate/types
  ↓
@safety, @registry
  ↓
@adapter, @comms, @tools, @skills, @agents
  ↓
@orchestrator, @fabric, @autobuild
  ↓
@daemon, @cloud, @mcp, @gateway, @cli
  ↓
@kg, @kdream, @vector, @memory, @evidence, @eval, @datasets, @learning, @branding
```

## Architecture Rules

1. **Safety above autonomy** — every action passes through the policy engine.
2. **Evidence above unsupported claims** — conclusions trace back to sources.
3. **Evaluation above untested learning** — no production change without evaluation.
4. **Registry and contracts above ad-hoc integration** — all components register through `@lawmate/registry`.
5. **Master brand** — LAWMATE, LAWMATE MCP, LAWMATE CLI, LAWMATE AI API GATEWAY.

## Event Model

Every operation carries:

```
{
  id, type, timestamp, source, actor, tenant,
  correlationId, causationId, payload, metadata
}
```

## Identifiers

Stable identifier scheme:

- `agent://lawmate/...`
- `skill://lawmate/...`
- `tool://lawmate/...`
- `dataset://lawmate/...`
- `evidence://lawmate/...`
- `eval://lawmate/...`
- `workflow://lawmate/...`
- `memory://lawmate/...`
- `kg://lawmate/...`
- `adapter://lawmate/...`

## Security

- Authentication and authorization at every boundary.
- Capability control — agents cannot grant themselves permissions.
- Tenant isolation on all persisted data.
- Append-only audit logs.
- Data minimization and redaction.
- Rate limiting and resource limits.
- Explicit decisions: ALLOW, DENY, REQUIRE_APPROVAL, REDACT, ESCALATE.

## Local Development

```bash
docker compose -f docker-compose.lawmate.yml up
```

Services: Redis, PostgreSQL + pgvector, Ollama, LAWMATE Gateway.
