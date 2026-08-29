---
title: Agent API Reference
id: agent-api
order: 4
---

# LAW MATE — Agent API Reference

All agent endpoints are exposed via **tRPC** at `http://localhost:3001/trpc` and via the **REST** gateway at `http://localhost:3001/api`.

---

## tRPC Endpoints

### `agents.orchestrate`

Run the full end-to-end legal pipeline (retrieve → analyse → validate → draft).

**Input**
```typescript
{
  query: string          // Legal question (min 10 chars)
  proBono?: boolean      // true = priority 1 queue
  docType?: "WRIT" | "AFFIDAVIT" | "SUBMISSION" | "COMPLAINT" | "LETTER_OF_DEMAND"
  parties?: {
    plaintiff: string
    defendant: string
    court: string
    caseNumber?: string
  }
  facts?: string
  citations?: string[]
}
```

**Output**
```typescript
{
  traceId: string
  jobId: string
  steps: string[]        // ["retrieve", "analyse", "validate", "draft"]
  status: "queued"
}
```

---

### `agents.retrieve`

Search Malaysian case law using hybrid semantic + BM25 search.

**Input**
```typescript
{
  query: string          // min 10 chars, BM or EN
  court?: "FC" | "CA" | "HC" | "SC" | "MC"
  yearFrom?: number
  yearTo?: number
  practiceArea?: string
  topK?: number          // default 5, max 50
  language?: "en" | "ms"
}
```

**Output**
```typescript
{
  traceId: string
  cases: Array<{
    id: string
    citation: string
    caseName: string
    court: string
    caseDate: string
    summary?: string
    relevanceScore: number   // 0–1
    status: "good_law" | "overruled" | "distinguished" | "questioned"
  }>
  totalResults: number
  queryTime: number
}
```

---

### `agents.analyse`

Run IRAC structured legal analysis on a fact pattern.

**Input**
```typescript
{
  facts: string          // min 50 chars
  citations?: Array<{ caseName: string; citation: string; relevance?: string }>
  jurisdiction?: "FC" | "CA" | "HC" | "SC" | "MC"   // default "HC"
  analysisType?: "full" | "brief" | "opinion"         // default "full"
}
```

**Output**
```typescript
{
  traceId: string
  jobId: string
  caseType: string
  legalIssues: Array<{
    issue: string
    analysis: string
    supportingCases: string[]
    counterArguments?: string[]
  }>
  applicableLaw: Array<{ statute: string; section?: string; relevance: string }>
  ratioDecidendi: string[]
  winProbability: number     // 0–100
  confidenceScore: number    // 0–1
  strengthsWeaknesses: { strengths: string[]; weaknesses: string[] }
  recommendations: string[]
}
```

---

### `agents.draft`

Generate a Malaysian court-ready legal document.

**Input**
```typescript
{
  docType: "WRIT" | "AFFIDAVIT" | "SUBMISSION" | "COMPLAINT" | "LETTER_OF_DEMAND"
  parties: { plaintiff: string; defendant: string; court: string; caseNumber?: string }
  facts: string
  reliefSought?: string
  citations?: string[]
  tone?: "neutral" | "adversarial" | "persuasive"   // default "neutral"
  format?: "markdown" | "docx" | "pdf"               // default "markdown"
}
```

**Output**
```typescript
{
  jobId: string
  document: string
  status: "queued" | "completed"
  citationsValidated: boolean
  format: string
}
```

---

### `agents.validate`

Validate Malaysian legal citations and check judicial treatment.

**Input**
```typescript
{
  citations: string[]    // e.g. ["[2020] 3 MLJ 100"]
  text?: string          // free text — citations extracted automatically
}
```

**Output**
```typescript
{
  traceId: string
  results: Array<{
    citation: string
    status: "valid" | "overruled" | "distinguished" | "questioned" | "invalid"
    tier: { tier: "green" | "yellow" | "red"; label: string }
    caseName?: string
    year?: number
    judicialTreatmentSummary: string
    laterCases: Array<{ citation: string; caseName: string; status: string; date: string }>
  }>
  summary: { total: number; valid: number; overruled: number; warning: number }
}
```

---

### `agents.debate`

Run a three-agent adversarial moot court debate.

**Input**
```typescript
{
  problem: string        // Legal issue to debate
  citations?: string[]   // Seed citations from legal_retrieve
  rounds?: 1 | 2 | 3    // default 2
}
```

**Output**
```typescript
{
  jobId: string
  transcript: Array<{ round: number; role: "applicant" | "respondent" | "judge"; argument: string; score?: number }>
  scores: { applicant: number; respondent: number }
  winner: "applicant" | "respondent"
  judgment: string
}
```

---

### `agents.queueHealth`

Get real-time queue depth and job status across all 11 agent queues.

**Input**: none

**Output**
```typescript
{
  queues: Record<string, {
    waiting: number
    active: number
    completed: number
    failed: number
    delayed: number
  }>
  timestamp: string
}
```

---

## REST Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/ai-chat` | Streaming SSE chat via Ollama |
| `POST` | `/api/agent/query` | Orchestrated query with provenance graph |
| `POST` | `/api/feedback` | Submit feedback on an agent response |
| `GET` | `/api/events/stream` | SSE stream of live agent events |
| `GET` | `/api/debates` | List debate transcripts |
| `GET` | `/api/debates/:id` | Get single debate transcript |
| `GET` | `/api/drafts` | List draft documents |
| `GET` | `/api/drafts/:id` | Get single draft document |
| `GET` | `/audit` | Query audit logs (`?traceId=&agentName=&limit=`) |
| `GET` | `/health` | System health |
| `GET` | `/health/db` | Database connectivity |
| `GET` | `/health/queue` | Queue job counts |
| `GET` | `/health/ollama` | Ollama model availability |
| `GET` | `/metrics` | Prometheus-style metrics |

---

## Error codes

| Code | Meaning |
|------|---------|
| `RULE_BLOCKED` | A safety rule blocked the request (e.g. overruled citation, missing retrieval step) |
| `VALIDATION_FAILED` | Input schema validation failed |
| `AGENT_NOT_FOUND` | Requested agent name not registered |
| `QUEUE_FULL` | BullMQ queue at capacity — retry after delay |
| `LLM_UNAVAILABLE` | Ollama not reachable at `OLLAMA_URL` |
