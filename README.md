# LAWMATE ⚖️🤖

LawMate is a legal AI platform for matter management, document drafting, research, agent governance, and operational analytics. The repository combines a Next.js 16 frontend, a TypeScript Express + tRPC backend, PostgreSQL with pgVector, Redis with BullMQ, and a local model stack based on Ollama.

The implementation is not a single prototype; it is a multi-layer application with storage, queue workers, streaming APIs, model routing, governance controls, and UI route groups that are all wired together in the codebase.

---

## Verified implementation

The current repo structure and runtime configuration match the following architecture:

- Next.js app in the root `app/` directory with route groups for dashboard, legal AI, governance, documents, research, compliance, and monitoring
- Express + tRPC backend in `backend/src/server.ts` with streaming endpoints for AI chat and drafting jobs
- BullMQ workers in `workers/` covering retrieval, validation, drafting, analysis, auditing, orchestration, privacy, monitoring, debate, indexing, testing, and sandbox execution
- Prisma schema in `prisma/schema.prisma` and database client wiring in `backend/src/db`
- Local and cloud LLM provider selection via `lib/ai.ts` and `.env.example`
- Redis-powered job scheduling and metrics via `package.json` scripts and the backend queue health endpoints

This is consistent with the repo’s actual code and dependency graph, not only the product narrative.

---

## Architecture

```mermaid
flowchart TB
    subgraph FE["Next.js 16 Frontend — port 3000"]
        direction TB
        FE_R["app/ routes<br/>dashboard · legalai · matters · documents<br/>research · governance · alerting · etc."]
    end

    subgraph BE["Express + tRPC Backend — port 3001"]
        direction TB
        BE_GW["API gateway + auth/session middleware"]
        BE_SSE["AI chat SSE endpoint"]
        BE_DRAFT["Drafting job SSE stream"]
        BE_PLAY["Provider playground endpoints"]
        BE_Q["Queue + health endpoints"]
    end

    subgraph MQ["Redis — BullMQ"]
        direction TB
        MQ_Q["Queues: retrieval · drafting · analysis<br/>validation · audit · orchestration<br/>privacy · debate · monitoring<br/>indexing · testing · sandbox"]
    end

    subgraph PG["PostgreSQL + pgVector"]
        PG_V["Vector search + legal data persistence<br/>1536-dim embeddings"]
    end

    subgraph WK["Worker processes in workers/"]
        direction TB
        W1["legal-retrieval"]
        W2["legal-analysis"]
        W3["legal-drafting"]
        W4["legal-validation"]
        W5["legal-audit"]
        W6["legal-orchestrator"]
        W7["legal-privacy"]
        W8["legal-debate"]
        W9["legal-monitoring"]
        W10["legal-indexing"]
        W11["legal-testing"]
        W12["legal-sandbox"]
    end

    subgraph MDL["Model providers"]
        direction TB
        OLL["Ollama — llama3.1 + mxbai-embed-large"]
        CLD["Optional: OpenAI / DeepInfra / OpenRouter"]
    end

    FE_R -->|HTTPS / tRPC / route handlers| BE_GW
    BE_GW --> BE_SSE
    BE_GW --> BE_DRAFT
    BE_GW --> BE_PLAY
    BE_GW --> BE_Q

    BE_GW -->|BullMQ jobs| MQ_Q
    BE_GW -->|Prisma ORM| PG_V

    MQ_Q --> W1
    MQ_Q --> W2
    MQ_Q --> W3
    MQ_Q --> W4
    MQ_Q --> W5
    MQ_Q --> W6
    MQ_Q --> W7
    MQ_Q --> W8
    MQ_Q --> W9
    MQ_Q --> W10
    MQ_Q --> W11
    MQ_Q --> W12

    W1 --> PG_V
    W3 --> PG_V
    W4 --> PG_V
    W5 --> PG_V

    W2 --> OLL
    W2 --> CLD
    OLL --> PG_V
    PG_V --> FE_R
```

---

## Runtime flow

```mermaid
flowchart LR
    U["User / lawyer"] --> FE["Next.js frontend<br/>app/ routes"]
    FE --> API["Express + tRPC backend<br/>backend/src/server.ts"]
    API --> TRPC["tRPC routers"]
    API --> SSE["AI chat + drafting<br/>SSE streams"]

    TRPC --> MQ["BullMQ / Redis"]

    MQ --> W1["legal-retrieval"]
    MQ --> W2["legal-analysis"]
    MQ --> W3["legal-drafting"]
    MQ --> W4["legal-validation"]
    MQ --> W5["legal-audit"]
    MQ --> W6["legal-orchestrator"]
    MQ --> W7["legal-privacy"]
    MQ --> W8["legal-debate"]
    MQ --> W9["legal-monitoring"]
    MQ --> W10["legal-indexing"]
    MQ --> W11["legal-testing"]
    MQ --> W12["legal-sandbox"]

    W1 --> PG[("PostgreSQL<br/>+ pgVector")]
    W2 --> OLLAMA["Ollama /<br/>model providers"]
    W3 --> PG
    W4 --> PG
    W5 --> PG

    OLLAMA --> LLM["LLM + embeddings"]
    PG --> FE

    style U fill:#e8f4f8,stroke:#0288d1
    style FE fill:#e3f2fd,stroke:#1565c0
    style API fill:#fff3e0,stroke:#ef6c00
    style MQ fill:#fce4ec,stroke:#c2185b
    style PG fill:#e8f5e9,stroke:#2e7d32
    style OLLAMA fill:#f3e5f5,stroke:#6a1b9a
```

---

## Core technology stack

```mermaid
mindmap
  root((LawMate<br/>Stack))
    Frontend
      Next.js 16
      React 19
      Tailwind CSS
      shadcn-style UI
      React Query
    Backend
      Express 5
      tRPC
      Prisma ORM
      PostgreSQL
      pgVector
    Queueing
      BullMQ
      Redis
    AI
      Ollama local inference
      mxbai-embed-large
      Optional OpenAI
      Optional DeepInfra
      Optional OpenRouter
    Runtime
      Node.js 24+
    Governance
      Audit logging
      Provenance
      Permissions
      Safety-oriented routing
```

---

## Repository layout

```mermaid
flowchart TD
    ROOT["📁 LawMate Repository"]

    ROOT --> APP["📁 app/<br/>Next.js app-router frontend"]
    ROOT --> BE["📁 backend/<br/>Express + tRPC backend"]
    ROOT --> WK["📁 workers/<br/>BullMQ worker entry points"]
    ROOT --> PRISMA["📁 prisma/<br/>Schema + migrations"]
    ROOT --> SCRIPTS["📁 scripts/<br/>Data sync · seeding · health"]
    ROOT --> TESTS["📁 tests/<br/>Automated validation checks"]
    ROOT --> COMP["📁 components/<br/>Reusable React UI"]
    ROOT --> HOOKS["📁 hooks/<br/>Custom client hooks"]
    ROOT --> LIB["📁 lib/<br/>Shared utilities + AI provider"]
    ROOT --> DOCS["📁 docs/<br/>Design + platform notes"]
    ROOT --> PUB["📁 public/<br/>Static assets"]

    style ROOT fill:#1a237e,color:#fff
    style APP fill:#e3f2fd
    style BE fill:#fff3e0
    style WK fill:#fce4ec
    style PRISMA fill:#e8f5e9
```

---

## Local development

### Prerequisites

- Node.js 24 or newer
- Docker and Docker Compose
- Ollama installed locally or available via the project container stack

### Setup

```mermaid
flowchart LR
    A["npm install"] --> B["cp .env.example .env"]
    B --> C["docker compose up -d"]
    C --> D["npx prisma db push"]
    D --> E["ollama pull llama3.1<br/>ollama pull mxbai-embed-large"]
    E --> F["npm run dev"]
    F --> G["🚀 Full stack running"]

    style A fill:#e3f2fd
    style G fill:#c8e6c9,stroke:#2e7d32
```

```bash
npm install
cp .env.example .env

docker compose up -d
npx prisma db push

ollama pull llama3.1
ollama pull mxbai-embed-large

npm run dev
```

The `npm run dev` script launches the Redis container, all worker processes, the backend, and the frontend concurrently.

---

## Runtime scripts

The repo exposes a proper application workflow through the script set in `package.json`:

```bash
npm run dev              # full stack: Redis + workers + backend + Next.js
npm run dev:next         # frontend only
npm run api:dev          # backend only
npm run workers:all      # launch every BullMQ worker
npm run worker:retrieval # single worker
npm run worker:analysis  # single worker
npm run worker:drafting  # single worker
npm run worker:validation
npm run worker:audit
npm run worker:orchestrator
npm run worker:privacy
npm run worker:debate
npm run worker:monitoring
npm run worker:indexing
npm run worker:testing
npm run worker:sandbox   # sandboxed execution worker
npm run db:push          # sync Prisma schema
npm run db:studio        # Prisma Studio
npm run build            # production Next.js build
npm run lint             # ESLint if present
npm run type-check       # TypeScript validation
npm run test:gold        # dispatch the gold-eval job
```

---

## Service URLs

```mermaid
flowchart LR
    subgraph SVC["Local Services"]
        direction TB
        S1["Frontend<br/>http://localhost:3000"]
        S2["Backend<br/>http://localhost:3001"]
        S3["tRPC<br/>http://localhost:3001/trpc"]
        S4["Health<br/>http://localhost:3001/health"]
        S5["Queue Health<br/>http://localhost:3001/health/queue"]
        S6["Ollama Health<br/>http://localhost:3001/health/ollama"]
        S7["Metrics<br/>http://localhost:3001/metrics"]
        S8["Audit Viewer<br/>http://localhost:3001/audit"]
        S9["OpenClaw Gateway<br/>http://localhost:3002"]
    end

    style S1 fill:#e3f2fd,stroke:#1565c0
    style S2 fill:#fff3e0,stroke:#ef6c00
    style S4 fill:#e8f5e9,stroke:#2e7d32
    style S9 fill:#f3e5f5,stroke:#6a1b9a
```

| Service | URL |
| --- | --- |
| Frontend | <http://localhost:3000> |
| Backend | <http://localhost:3001> |
| tRPC | <http://localhost:3001/trpc> |
| Health | <http://localhost:3001/health> |
| Queue health | <http://localhost:3001/health/queue> |
| Ollama health | <http://localhost:3001/health/ollama> |
| Metrics | <http://localhost:3001/metrics> |
| Audit viewer | <http://localhost:3001/audit> |
| OpenClaw gateway | <http://localhost:3002> |

---

## Worker inventory

```mermaid
flowchart TB
    subgraph QUEUES["BullMQ Queue Responsibilities"]
        direction LR
        Q1["legal-retrieval<br/>semantic retrieval<br/>+ vector search"]
        Q2["legal-analysis<br/>reasoning pipeline"]
        Q3["legal-drafting<br/>document generation"]
        Q4["legal-validation<br/>citation + hallucination"]
        Q5["legal-audit<br/>immutable audit trail"]
        Q6["legal-orchestrator<br/>DAG coordination"]
        Q7["legal-privacy<br/>redaction + consent"]
        Q8["legal-debate<br/>multi-agent argument"]
        Q9["legal-monitoring<br/>regulatory alerts"]
        Q10["legal-indexing<br/>ingestion + embeddings"]
        Q11["legal-testing<br/>eval + benchmarks"]
        Q12["legal-sandbox<br/>isolated execution"]
    end

    style Q1 fill:#e3f2fd
    style Q2 fill:#fff3e0
    style Q3 fill:#fce4ec
    style Q4 fill:#e8f5e9
    style Q5 fill:#f3e5f5
    style Q6 fill:#e0f7fa
    style Q7 fill:#fff8e1
    style Q8 fill:#fbe9e7
    style Q9 fill:#e8eaf6
    style Q10 fill:#f1f8e9
    style Q11 fill:#fce4ec
    style Q12 fill:#eceff1
```

| Worker | Responsibility |
| --- | --- |
| `legal-retrieval` | semantic retrieval and vector search orchestration |
| `legal-analysis` | reasoning and analysis pipeline |
| `legal-drafting` | drafting and document generation |
| `legal-validation` | citation and hallucination validation |
| `legal-audit` | immutable audit trail and governance logging |
| `legal-orchestrator` | workflow orchestration and DAG coordination |
| `legal-privacy` | privacy, redaction, and consent-aware processing |
| `legal-debate` | multi-agent argument simulation |
| `legal-monitoring` | regulatory monitoring and alerts |
| `legal-indexing` | ingestion, embeddings, and index maintenance |
| `legal-testing` | evaluation jobs and benchmark checks |
| `legal-sandbox` | isolated execution environment for sandboxed tasks |

---

## Feature areas visible in the app

```mermaid
mindmap
  root((App Route<br/>Groups))
    Operations
      /dashboard
      /analytics
      /search
    Legal Work
      /legalai
      /matters
      /clients
      /contracts
      /drafting
      /research
    Governance
      /audit
      /governance
      /approvals
      /alerts
    Monitoring
      /monitoring
```

The frontend route groups show the product surface area implied by the codebase:

- `/dashboard` — operator and activity overview
- `/legalai` — assisted legal analysis and workflows
- `/matters` — matter tracking
- `/clients` — client and relationship management
- `/contracts` — contract intelligence
- `/drafting` — document drafting workspace
- `/research` — legal research and evidence review
- `/monitoring` — alerts and legal monitoring
- `/audit` and `/governance` — compliance and traceability
- `/approvals` and `/alerts` — review and action workflows
- `/search` and `/analytics` — operational search and reporting

This matches the broader application story in the repository and is directly reflected in the app folder structure.

---

## Safety and governance

```mermaid
flowchart LR
    subgraph SAFETY["Safety & Governance Layer"]
        direction TB
        AUTH["Auth / session validation"]
        CRED["Provider credential handling"]
        HMAC["HMAC audit signing"]
        BYOK["BYOK provider support"]
        SBX["Sandboxed execution"]
        PERM["Permissions + provenance"]
    end

    INPUT["User request"] --> SAFETY
    SAFETY --> OUTPUT["Governed response"]

    style SAFETY fill:#fff3e0,stroke:#ef6c00
    style INPUT fill:#e3f2fd
    style OUTPUT fill:#e8f5e9
```

The repo strongly emphasizes model safety, evidence accountability, and permit boundaries. The backend includes middleware, auth/session validation, provider credential handling, health/metrics endpoints, and audit-related modules. The legal and governance aspects are not just marketing language; they are implemented as backend logic and operational workflows.

The project also includes environment variables for safe secret handling, versioned DB schema, audit/hmac signing, BYOK provider support, and sandboxed execution.

---

## Notes for production use

- Keep secrets in `.env` and rotate them before deployment.
- Run PostgreSQL, Redis, and Ollama through Docker or your deployment platform.
- Use the project’s local LLM defaults for confidential or privileged work; cloud providers should be treated as optional and not used for sensitive client data without a policy decision.
- Use the queue health and backend metrics endpoints to validate runtime health before exposing deeper workflows.

---

## AutoClaw substrate

The repository also contains the embedded multi-agent runtime under [.autoclaw](.autoclaw). This is not a separate product; it is the orchestration, memory, and governance substrate the legal platform can use for agent coordination and structured knowledge work.

The project’s own docs describe it as a self-hosted multi-agent orchestration system comprising a knowledge graph, vector store, durable spine, memory consolidation cycle, human-in-the-loop safety layer, and portable skills library. That is consistent with the live folder structure and with the runtime tests that import its modules, such as [tests/autoclaw/hybrid-retriever.test.js](tests/autoclaw/hybrid-retriever.test.js).

### AutoClaw architecture

```mermaid
flowchart TB
    subgraph AC["AutoClaw Multi-Agent Runtime"]
        direction TB

        subgraph TOP["Orchestration Layer"]
            ORCH["orchestrator<br/>sprint board · loop state<br/>board reconciliation"]
            COMMS["comms<br/>inter-agent messaging<br/>inboxes · loop-state"]
            FABRIC["fabric<br/>agent card · registry<br/>governance · federation"]
            AUTO["autobuild<br/>scheduler · heartbeat"]
        end

        subgraph MID["Capability Layer"]
            AGENTS["agents<br/>retrieval · analysis<br/>validation · routing"]
            SKILLS["skills<br/>SKILL.md · JSON contracts<br/>golden samples · eval metadata"]
            TOOLS["tools<br/>generic execution primitives"]
            TASKS["tasks<br/>planning · decomposition"]
            MCP["mcp<br/>Model Context Protocol"]
        end

        subgraph MEM["Memory & Knowledge Layer"]
            KG["kg<br/>knowledge graph"]
            VEC["vector<br/>SQLite-backed embeddings"]
            MEM2["memory<br/>retrieval · promotion"]
            KDR["kdream<br/>memory consolidation"]
            SPINE["spine<br/>durable run records"]
            LEARN["learnings<br/>legal knowledge notes"]
        end

        subgraph GOV["Governance & Safety Layer"]
            SAFE["safety<br/>approval gates · kill switch<br/>cost controls"]
            EVID["evidence<br/>append-only chain"]
            HITL["hitl<br/>approval queue · escalation"]
            HARD["hardening<br/>resilience · recovery"]
            EVAL["eval<br/>harness · leaderboard"]
        end

        subgraph EXEC["Execution Layer"]
            WF["workflows<br/>traces · replay · ledger"]
            DAEMON["daemon<br/>local control UI"]
            CLOUD["cloud<br/>optional relay"]
            BIN["bin<br/>CLI entrypoints"]
        end

        subgraph SUPPORT["Support"]
            I18N["i18n<br/>localization"]
            OBS["observability<br/>logger · metrics · tracer"]
            MET["metrics<br/>effectiveness snapshots"]
            TEST["test<br/>node:test suites"]
            DOCS2["docs<br/>RFCs · guidance"]
            REG["registry<br/>descriptive catalog"]
        end
    end

    ORCH --> AGENTS
    AGENTS --> SKILLS
    AGENTS --> TOOLS
    AGENTS --> MCP
    ORCH --> COMMS
    ORCH --> FABRIC

    AGENTS --> MEM2
    MEM2 --> KG
    MEM2 --> VEC
    MEM2 --> KDR
    AGENTS --> SPINE
    AGENTS --> LEARN

    AGENTS --> SAFE
    SAFE --> HITL
    AGENTS --> EVID
    AGENTS --> EVAL
    SAFE --> HARD

    ORCH --> WF
    WF --> DAEMON
    WF --> CLOUD
    BIN --> ORCH

    style AC fill:#f5f5f5,stroke:#333,stroke-width:2px
    style TOP fill:#e3f2fd,stroke:#1565c0
    style MID fill:#fff3e0,stroke:#ef6c00
    style MEM fill:#e8f5e9,stroke:#2e7d32
    style GOV fill:#fce4ec,stroke:#c2185b
    style EXEC fill:#f3e5f5,stroke:#6a1b9a
    style SUPPORT fill:#eceff1,stroke:#546e7a
```

### Folder-by-folder justification

```mermaid
flowchart LR
    subgraph AC["📁 .autoclaw"]
        direction TB
        A1["📁 agents<br/>runtime agent implementations"]
        A2["📁 orchestrator<br/>sprint board · coordination"]
        A3["📁 skills<br/>reusable skill library"]
        A4["📁 registry<br/>descriptive catalog"]
        A5["📁 kg<br/>knowledge graph"]
        A6["📁 kdream<br/>memory consolidation"]
        A7["📁 spine<br/>durable run records"]
        A8["📁 vector<br/>SQLite vector store"]
        A9["📁 learnings<br/>legal knowledge notes"]
        A10["📁 eval<br/>evaluation harness"]
        A11["📁 evidence<br/>append-only provenance"]
        A12["📁 safety<br/>approval gates · kill switch"]
        A13["📁 workflows<br/>execution · traces · replay"]
        A14["📁 memory<br/>retrieval · promotion"]
        A15["📁 mcp<br/>Model Context Protocol"]
        A16["📁 comms<br/>inter-agent messaging"]
        A17["📁 daemon<br/>local control daemon"]
        A18["📁 cloud<br/>optional cloud relay"]
        A19["📁 bin<br/>Node CLI entrypoints"]
        A20["📁 test<br/>node:test suites"]
        A21["📁 docs<br/>architectural docs · RFCs"]
        A22["📁 metrics<br/>effectiveness snapshots"]
        A23["📁 observability<br/>logger · metrics · tracer"]
        A24["📁 autobuild<br/>scheduler · heartbeat"]
        A25["📁 hardening<br/>resilience · recovery"]
        A26["📁 hitl<br/>human-in-the-loop queue"]
        A27["📁 fabric<br/>agent card · governance"]
        A28["📁 i18n<br/>localization"]
        A29["📁 tasks<br/>planning · decomposition"]
        A30["📁 tools<br/>execution primitives"]
        A31["📁 datasets<br/>curated data supply"]
    end

    style A1 fill:#e3f2fd
    style A3 fill:#fff3e0
    style A5 fill:#e8f5e9
    style A12 fill:#fce4ec
    style A31 fill:#f3e5f5
```

- [.autoclaw/agents](.autoclaw/agents) — runtime agent implementations for retrieval, analysis, validation, and capability routing
- [.autoclaw/orchestrator](.autoclaw/orchestrator) — sprint board, agent communications, loop state, board reconciliation, and coordination logic
- [.autoclaw/skills](.autoclaw/skills) — reusable skill library with `SKILL.md`, JSON contracts, golden samples, and eval metadata
- [.autoclaw/registry](.autoclaw/registry) — descriptive catalog of agents, models, and skills, without executable implementations
- [.autoclaw/kg](.autoclaw/kg) — knowledge graph persistence and query logic for structured memory
- [.autoclaw/kdream](.autoclaw/kdream) — memory consolidation and graph-dream cycle that refines prior state
- [.autoclaw/spine](.autoclaw/spine) — durable run records and decision history for traceability
- [.autoclaw/vector](.autoclaw/vector) — SQLite-backed vector storage for embeddings and preferences
- [.autoclaw/learnings](.autoclaw/learnings) — legal knowledge, retrieval guidance, and immutable insight notes
- [.autoclaw/eval](.autoclaw/eval) — evaluation harness, leaderboard, traces, and scoring framework
- [.autoclaw/evidence](.autoclaw/evidence) — append-only evidence chain and provenance store
- [.autoclaw/safety](.autoclaw/safety) — approval gates, adversarial guards, kill switch, and cost controls
- [.autoclaw/workflows](.autoclaw/workflows) — workflow execution, traces, replay, and run ledger
- [.autoclaw/memory](.autoclaw/memory) — memory interfaces and retrieval/promotion logic
- [.autoclaw/mcp](.autoclaw/mcp) — Model Context Protocol resources and server integration
- [.autoclaw/comms](.autoclaw/comms) — inter-agent messaging, inboxes, and loop-state coordination
- [.autoclaw/daemon](.autoclaw/daemon) — local control daemon and operator UI / lifecycle logic
- [.autoclaw/cloud](.autoclaw/cloud) — optional cloud relay and remote coordination path
- [.autoclaw/bin](.autoclaw/bin) — executable Node CLI entrypoints for init, check, board, dream, and other runtime commands
- [.autoclaw/test](.autoclaw/test) — node:test suites validating memory, KG, MCP, and other internal components
- [.autoclaw/docs](.autoclaw/docs) — architectural docs, RFCs, and operating guidance
- [.autoclaw/metrics](.autoclaw/metrics) — effectiveness and token snapshots
- [.autoclaw/observability](.autoclaw/observability) — logger, metrics, and tracer abstractions
- [.autoclaw/autobuild](.autoclaw/autobuild) — scheduler and heartbeat logic for continuous workflow supervision
- [.autoclaw/hardening](.autoclaw/hardening) — resilience and recovery utilities for failed runs
- [.autoclaw/hitl](.autoclaw/hitl) — human-in-the-loop approval queue and escalation path
- [.autoclaw/fabric](.autoclaw/fabric) — agent card, registry, governance, and federation layer
- [.autoclaw/i18n](.autoclaw/i18n) — localization and prompt-language support
- [.autoclaw/tasks](.autoclaw/tasks) — planning and task decomposition support for the agent system
- [.autoclaw/tools](.autoclaw/tools) — generic execution primitives for agents

### Datasets layer

The AutoClaw runtime also includes a dedicated dataset package under [.autoclaw/datasets](.autoclaw/datasets). This is the curated data supply for evaluation, retrieval, and legal-domain grounding, not just a scratch area.

```mermaid
flowchart TD
    A["📁 .autoclaw/datasets<br/>Top-level registry + data-index"]

    A --> B["📁 asean<br/>ASEAN legal & policy data"]
    A --> C["📁 cases<br/>Case-law dataset material"]
    A --> D["📁 consensus<br/>Adjudication-style assets"]
    A --> E["📁 i18n<br/>Multilingual data"]
    A --> F["📁 Law Of Malaysia<br/>Legal-ontology metadata"]
    A --> G["📁 seed<br/>Bootstrapping content"]
    A --> H["📁 skills<br/>Skill-specific eval inputs"]

    B --> I["🌏 Grounding + regional<br/>legal context"]
    C --> J["🔍 Retrieval + ranking"]
    D --> K["⚖️ Decision /<br/>adjudication patterns"]
    E --> L["🌐 Localization +<br/>multilingual support"]
    F --> M["📋 Legislation metadata<br/>+ ontology"]
    G --> N["🚀 Bootstrapping +<br/>local setup"]
    H --> O["🎯 Skill-specific<br/>evaluation data"]

    I --> P["🧠 Memory + learning<br/>+ evaluation loop"]
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P

    P --> Q["🛡️ Safety / retrieval<br/>/ orchestration"]

    style A fill:#1a237e,color:#fff
    style P fill:#e8f5e9,stroke:#2e7d32
    style Q fill:#fce4ec,stroke:#c2185b
```

- [.autoclaw/datasets](.autoclaw/datasets) — top-level dataset registry and data-index entry point
- [.autoclaw/datasets/asean](.autoclaw/datasets/asean) — ASEAN legal and policy data used for region-specific grounding
- [.autoclaw/datasets/cases](.autoclaw/datasets/cases) — case-law dataset material for retrieval and ranking
- [.autoclaw/datasets/consensus](.autoclaw/datasets/consensus) — consensus-oriented or adjudication-style dataset assets
- [.autoclaw/datasets/i18n](.autoclaw/datasets/i18n) — multilingual and localization data used for language-aware processing
- [.autoclaw/datasets/lom](.autoclaw/datasets/lom) — Law Of Malaysia legal-ontology and legislation metadata dataset support
- [.autoclaw/datasets/seed](.autoclaw/datasets/seed) — bootstrapping dataset content for initialization and local setup
- [.autoclaw/datasets/skills](.autoclaw/datasets/skills) — skill-specific dataset inputs used for evaluation and validation

This folder is important because AutoClaw is designed to evaluate and ground agent behavior with real or structured domain datasets, not to rely only on prompt-level heuristics. The dataset layout lines up with the rest of the runtime: memory, retrieval, learning, evaluation, and safety all consume data from the same domain-aware framework.

```mermaid
flowchart TD
    A[AutoClaw datasets] --> B[asean]
    A --> C[cases]
    A --> D[consensus]
    A --> E[i18n]
    A --> F[Law Of Malaysia]
    A --> G[seed]
    A --> H[skills]

    B --> I[Grounding + regional legal context]
    C --> J[Retrieval + ranking]
    D --> K[Decision / adjudication patterns]
    E --> L[Localization + multilingual support]
    F --> M[Legislation metadata + ontology]
    G --> N[Bootstrapping + local setup]
    H --> O[Skill-specific evaluation data]

    I --> P[Memory + learning + evaluation loop]
    J --> P
    K --> P
    L --> P
    M --> P
    N --> P
    O --> P
    P --> Q[Safety / retrieval / orchestration]
```

This layout makes sense as a layered runtime: orchestration and communication at the top, capability and skill modules underneath, memory and knowledge graph layers below that, and safety/evaluation layers around all of it. The root package scripts and the test suite confirm that these are active, executable subsystems rather than purely illustrative files.

---

## End-to-end request lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor U as User / Lawyer
    participant FE as Next.js Frontend
    participant API as Express + tRPC
    participant MQ as BullMQ / Redis
    participant W as Worker
    participant PG as PostgreSQL + pgVector
    participant LLM as Ollama / Providers

    U->>FE: Submit legal query
    FE->>API: tRPC mutation / SSE request
    API->>API: Auth + session validation
    API->>MQ: Enqueue job
    MQ-->>API: Job ID
    API-->>FE: SSE stream opened

    MQ->>W: Dispatch to worker
    W->>PG: Retrieve context / embeddings
    PG-->>W: Vector search results
    W->>LLM: Inference request
    LLM-->>W: Generated response
    W->>PG: Persist results + audit trail
    W->>MQ: Mark complete
    MQ-->>API: Job result
    API-->>FE: Stream tokens
    FE-->>U: Render response

    Note over W,PG: Audit + governance<br/>logged immutably
```

---

This project is licensed under the MIT License.

---

## Workers

```mermaid
flowchart LR
    subgraph WORKERS["Worker Commands"]
        direction TB
        W1["npm run workers:all<br/>All 11 legal workers concurrently"]
        W2["npm run worker:retrieval"]
        W3["npm run worker:analysis"]
        W4["npm run worker:drafting"]
        W5["npm run worker:validation"]
        W6["npm run worker:audit"]
        W7["npm run worker:orchestrator"]
        W8["npm run worker:privacy"]
        W9["npm run worker:debate"]
        W10["npm run worker:monitoring"]
        W11["npm run worker:indexing"]
        W12["npm run worker:testing"]
    end
```

```bash
npm run workers:all      # All 11 legal workers concurrently
npm run worker:retrieval # Individual worker
npm run worker:analysis
npm run worker:drafting
npm run worker:validation
npm run worker:audit
npm run worker:orchestrator
npm run worker:privacy
npm run worker:debate
npm run worker:monitoring
npm run worker:indexing
npm run worker:testing
```

## Database

```mermaid
flowchart LR
    subgraph DB["Database Commands"]
        D1["npm run db:push<br/>Sync schema"]
        D2["npm run db:migrate<br/>Create + apply migration"]
        D3["npm run db:generate<br/>Regenerate Prisma client"]
        D4["npm run db:studio<br/>Open Prisma Studio"]
    end

    D1 --> D2 --> D3 --> D4
```

```bash
npm run db:push          # Sync schema (no migration file)
npm run db:migrate       # Create and apply migration
npm run db:generate      # Regenerate Prisma client
npm run db:studio        # Open Prisma Studio
```

## Build & production

```bash
npm run build            # Next.js production build
npm run start:next       # Serve production build
npm run preview          # Build + serve
```

## OpenClaw

```mermaid
flowchart LR
    OC["npm run openclaw<br/>Start OpenClaw agent (local session)"]
    OCG["npm run openclaw:gateway<br/>Start OpenClaw gateway"]

    OC --> OCG
```

```bash
npm run openclaw         # Start OpenClaw agent (local session)
npm run openclaw:gateway # Start OpenClaw gateway
```

## Quality

```mermaid
flowchart LR
    Q1["npm run lint<br/>ESLint (zero warnings)"]
    Q2["npm run type-check<br/>TypeScript check (no emit)"]
    Q3["npm run test:gold<br/>Run gold eval dataset"]

    Q1 --> Q2 --> Q3
```

```bash
npm run lint             # ESLint (zero warnings)
npm run type-check       # TypeScript check (no emit)
```

## Evaluation

```bash
npm run test:gold        # Run gold eval dataset against live system
```

---

## Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/legalai

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Ollama
OLLAMA_URL=http://localhost:11434
LLM_MODEL=llama3.1
EMBED_MODEL=mxbai-embed-large

# Auth
# 32+ random chars. Generate with: openssl rand -hex 32
# Production refuses to start on a missing, placeholder, or short value.
SESSION_SECRET=change-me-at-least-32-random-characters-long
# Signs agent output + audit hash chain. Also 32+ random chars, also fail-closed.
HMAC_SECRET=change-me-at-least-32-random-characters-long
# Encrypts BYOK provider keys at rest. Separate from SESSION_SECRET.
# MIGRATION: if you relied on the old ENCRYPTION_KEY || SESSION_SECRET fallback,
# set this to your current SESSION_SECRET first or stored credentials break.
ENCRYPTION_KEY=change-me-at-least-32-random-characters-long

# Optional: OpenAI (for GPT-4o — confidential data must not be sent)
OPENAI_API_KEY=sk-...

# Backend
PORT=3001
```

---

## Tech Stack

```mermaid
mindmap
  root((Tech<br/>Stack))
    Frontend
      Next.js 16
      React 19
      TanStack Query
      Tailwind CSS 4
      Radix UI
      Framer Motion
    Backend
      Express 5
      tRPC 11
      Prisma 7
      Node.js ≥22
    AI / LLM
      Ollama
      llama3.1
      mxbai-embed-large
      AI SDK
      TanStack AI
    Vector DB
      pgVector
      1536-dim embeddings
    Queue
      BullMQ 6
      Redis
      11 queues
      Flow producer
      Dead-letter
    Auth
      Session tokens
      HMAC-SHA256 passwords
      RBAC
    Observability
      Prometheus metrics
      Pino logging
      SSE event stream
    Agent Framework
      OpenClaw gateway
      30+ legal skills
    Infrastructure
      Docker Compose
      PostgreSQL
      Redis
      Ollama
```

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TanStack Query, Tailwind CSS 4, Radix UI, Framer Motion |
| Backend | Express 5, tRPC 11, Prisma 7, Node.js ≥22 |
| AI / LLM | Ollama (llama3.1, mxbai-embed-large), AI SDK, TanStack AI |
| Vector DB | pgVector (PostgreSQL) — 1536-dimension embeddings |
| Queue | BullMQ 6 (Redis) — 11 queues, flow producer, dead-letter |
| Auth | Session tokens, HMAC-SHA256 passwords, RBAC |
| Observability | Prometheus metrics endpoint, structured Pino logging, SSE event stream |
| Agent framework | OpenClaw gateway — 30+ legal skills |
| Infrastructure | Docker Compose — PostgreSQL, Redis, Ollama |

---

## OpenClaw Skills

```mermaid
mindmap
  root((OpenClaw<br/>Skills))
    Core
      legal-my
      legal-analyse
      legal-draft
      legal-retrieve
      legal-audit
      legal-debate
      legal-monitor
      legal-privacy
      legal-validate
      legal-index
      legal-orchestrate
      legal-hitl
    Practice Areas
      legal-contract-law
      legal-civil-litigation
      legal-criminal-procedure
      legal-employment
      legal-family-law
      legal-company-law
      legal-banking-finance
      legal-cyber-law
      legal-digital-assets
      legal-esg
      legal-human-rights
      legal-intellectual-property
      legal-probate-estate
      legal-arbitration-nonparty
      legal-environment-law
      legal-tort-law
      legal-evidence-law
      legal-ethics-expert
      legal-adr
```

30+ legal skill files under `.openclaw/skills/`:

`legal-my` · `legal-analyse` · `legal-draft` · `legal-retrieve` · `legal-audit` · `legal-debate` · `legal-monitor` · `legal-privacy` · `legal-validate` · `legal-index` · `legal-orchestrate` · `legal-hitl` · `legal-contract-law` · `legal-civil-litigation` · `legal-criminal-procedure` · `legal-employment` · `legal-family-law` · `legal-company-law` · `legal-banking-finance` · `legal-cyber-law` · `legal-digital-assets` · `legal-esg` · `legal-human-rights` · `legal-intellectual-property` · `legal-probate-estate` · `legal-arbitration-nonparty` · `legal-environment-law` · `legal-tort-law` · `legal-evidence-law` · `legal-ethics-expert` · `legal-adr`

---

## Datasets

```mermaid
flowchart TD
    subgraph DS["📁 datasets/"]
        direction TB
        D1["01_contracts_seed.txt – 13_intellectual_property_seed.txt<br/>Malaysian case law by area"]
        D2["gold_eval_dataset.json<br/>Ground-truth Q&A pairs"]
        D3["adversarial_test_vectors.json<br/>Prompt injection + hallucination tests"]
        D4["sample-contracts.txt<br/>Sample Malaysian contracts"]
        D5["use-cases.json / use-cases-02.json / use-cases-03.json<br/>End-to-end workflow test cases"]
    end

    D1 --> EVAL["Evaluation +<br/>Retrieval"]
    D2 --> EVAL
    D3 --> EVAL
    D4 --> EVAL
    D5 --> EVAL

    style DS fill:#f3e5f5,stroke:#6a1b9a
```

Seed data and evaluation sets under `datasets/`:

| File | Contents |
| --- | --- |
| `01_contracts_seed.txt` – `13_intellectual_property_seed.txt` | Malaysian case law by area |
| `gold_eval_dataset.json` | Ground-truth Q&A pairs for accuracy evaluation |
| `adversarial_test_vectors.json` | Prompt injection and hallucination test cases |
| `sample-contracts.txt` | Sample Malaysian contracts for contract agent testing |
| `use-cases.json` / `use-cases-02.json` / `use-cases-03.json` | End-to-end workflow test cases |

---

## Troubleshooting

```mermaid
flowchart TD
    T1["DB connection error"] --> F1["docker compose logs postgres<br/>check DATABASE_URL"]
    T2["Queues stuck / not processing"] --> F2["curl localhost:3001/health/queue<br/>check Redis connection"]
    T3["Ollama models missing"] --> F3["ollama ps<br/>ollama pull llama3.1<br/>ollama pull mxbai-embed-large"]
    T4["Slow first response"] --> F4["Model cold start —<br/>subsequent requests faster"]
    T5["tRPC 401 errors"] --> F5["Session token missing/expired<br/>re-authenticate"]
    T6["Build fails: setRawMode EIO"] --> F6["Codespace TTY issue —<br/>build succeeded if ✓ Compiled successfully"]
    T7["radix-ui module not found"] --> F7["Use @radix-ui/react-*<br/>scoped packages"]

    style T1 fill:#ffebee
    style T2 fill:#fff3e0
    style T3 fill:#e8f5e9
    style T4 fill:#e3f2fd
    style T5 fill:#fce4ec
    style T6 fill:#f3e5f5
    style T7 fill:#eceff1
```

| Symptom | Fix |
| --- | --- |
| DB connection error | `docker compose logs postgres` — check `DATABASE_URL` |
| Queues stuck / not processing | `curl localhost:3001/health/queue` — check Redis connection |
| Ollama models missing | `ollama ps` — run `ollama pull llama3.1 && ollama pull mxbai-embed-large` |
| Slow first response | Model cold start — subsequent requests are faster |
| tRPC 401 errors | Session token missing or expired — re-authenticate |
| Build fails: `setRawMode EIO` | Codespace TTY issue — build succeeded if `✓ Compiled successfully` appears |
| `radix-ui` module not found | Use `@radix-ui/react-*` scoped packages, not `radix-ui` |

---

## License

MIT — see [LICENSE](LICENSE)
