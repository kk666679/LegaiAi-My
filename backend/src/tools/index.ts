import { z } from 'zod'

// Minimal tool definition factory — mirrors @tanstack/ai toolDefinition shape
// without requiring the ESM-only @tanstack/ai package at startup.
function toolDefinition<TInput extends z.ZodTypeAny, TOutput extends z.ZodTypeAny>(def: {
  name: string
  description: string
  inputSchema: TInput
  outputSchema: TOutput
}) {
  return {
    ...def,
    server: (fn: (input: z.infer<TInput>) => Promise<z.infer<TOutput>>) => ({
      ...def,
      execute: fn,
    }),
  }
}

// ── Tool 1: Legal Case Retrieval ─────────────────────────────────────────────
export const legalRetrieveDef = toolDefinition({
  name: 'legal_retrieve',
  description: 'Search Malaysian case law by semantic query. Returns top matching cases with citations and similarity scores.',
  inputSchema: z.object({
    query: z.string().describe('Legal question or topic to search'),
    topK: z.number().default(5).describe('Number of cases to return'),
    court: z.enum(['FEDERAL', 'APPEAL', 'HIGH', 'SESSIONS', 'MAGISTRATE']).optional(),
  }),
  outputSchema: z.object({
    cases: z.array(z.object({
      citation: z.string(),
      content: z.string(),
      court: z.string().optional(),
      similarity: z.number(),
    })),
    traceId: z.string(),
  }),
})

// ── Tool 2: Legal Analysis ───────────────────────────────────────────────────
export const legalAnalyseDef = toolDefinition({
  name: 'legal_analyse',
  description: 'Analyse a legal task or question using retrieved cases.',
  inputSchema: z.object({
    task: z.string(),
    cases: z.array(z.object({
      citation: z.string().optional(),
      content: z.string().optional(),
      confidence: z.number().optional(),
    })).default([]),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 3: Legal Document Drafting ─────────────────────────────────────────
export const legalDraftDef = toolDefinition({
  name: 'legal_draft',
  description: 'Draft a Malaysian legal document with proper citations.',
  inputSchema: z.object({
    docType: z.enum(['WRIT', 'AFFIDAVIT', 'SUBMISSION', 'COMPLAINT']),
    tone: z.enum(['adversarial', 'neutral', 'persuasive']).default('neutral'),
    format: z.enum(['markdown', 'docx', 'pdf']).default('markdown'),
    parties: z.object({
      plaintiff: z.string(),
      defendant: z.string(),
      court: z.string(),
      caseNumber: z.string().optional(),
    }),
    facts: z.string(),
    reliefSought: z.string().optional(),
    citations: z.array(z.string()).default([]),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 4: Citation Validation ──────────────────────────────────────────────
export const legalValidateDef = toolDefinition({
  name: 'legal_validate',
  description: 'Validate a Malaysian legal citation.',
  inputSchema: z.object({
    citation: z.string().optional(),
    text: z.string().optional(),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 5: Legal Debate ─────────────────────────────────────────────────────
export const legalDebateDef = toolDefinition({
  name: 'legal_debate',
  description: 'Run a structured adversarial debate on a legal problem.',
  inputSchema: z.object({
    problem: z.string(),
    citations: z.array(z.string()).default([]),
    rounds: z.number().default(2),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 6: Privacy / PII Redaction ─────────────────────────────────────────
export const legalPrivacyDef = toolDefinition({
  name: 'legal_privacy',
  description: 'Redact PII from legal text or manage user consent per PDPA Malaysia.',
  inputSchema: z.object({
    action: z.enum(['redact', 'set_consent', 'get_consent', 'minimise']),
    text: z.string().optional(),
    userId: z.string().optional(),
    consentPrefs: z.object({
      allowLLM: z.boolean().optional(),
      allowDraft: z.boolean().optional(),
      dataRegion: z.string().optional(),
    }).optional(),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 7: Audit & Legal Hold ───────────────────────────────────────────────
export const legalAuditDef = toolDefinition({
  name: 'legal_audit',
  description: 'Write audit logs, apply legal holds, or execute PDPA right-to-be-forgotten.',
  inputSchema: z.object({
    action: z.enum(['legal_hold', 'forget_user', 'log']),
    caseId: z.string().optional(),
    userId: z.string().optional(),
    data: z.record(z.string(), z.unknown()).optional(),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 8: Orchestrate Full Workflow ────────────────────────────────────────
export const legalOrchestrateDef = toolDefinition({
  name: 'legal_orchestrate',
  description: 'Orchestrate the full legal workflow: retrieval → analysis → validation → drafting.',
  inputSchema: z.object({
    query: z.string(),
    docType: z.enum(['WRIT', 'AFFIDAVIT', 'SUBMISSION', 'COMPLAINT']).optional(),
    parties: z.object({
      plaintiff: z.string(),
      defendant: z.string(),
      court: z.string(),
      caseNumber: z.string().optional(),
    }).optional(),
    facts: z.string().optional(),
    citations: z.array(z.string()).default([]),
    proBono: z.boolean().default(false),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 9: Monitoring & Alerts ──────────────────────────────────────────────
export const legalMonitorDef = toolDefinition({
  name: 'legal_monitor',
  description: 'Subscribe to legal topic alerts, detect trends, or send verified alerts.',
  inputSchema: z.object({
    action: z.enum(['subscribe', 'detect_trend', 'send_alert']),
    userId: z.string().optional(),
    topics: z.array(z.string()).optional(),
    series: z.array(z.number()).optional(),
    alert: z.object({
      title: z.string(),
      body: z.string().optional(),
      sourceUrl: z.string().optional(),
      confidence: z.number().default(0.95),
      topic: z.string().optional(),
    }).optional(),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 10: Embedding & Indexing ────────────────────────────────────────────
export const legalIndexDef = toolDefinition({
  name: 'legal_index',
  description: 'Chunk, embed, and index legal documents into pgvector.',
  inputSchema: z.object({
    collection: z.string(),
    documents: z.array(z.object({
      id: z.string().optional(),
      content: z.string(),
      metadata: z.record(z.string(), z.unknown()).optional(),
      approvedBy: z.string().optional(),
    })),
    requireApproval: z.boolean().default(false),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

// ── Tool 11: Testing & Evaluation ───────────────────────────────────────────
export const legalTestDef = toolDefinition({
  name: 'legal_test',
  description: 'Run gold dataset evaluation, adversarial tests, or benchmark retrieval.',
  inputSchema: z.object({
    action: z.enum(['gold_eval', 'adversarial', 'benchmark']),
    count: z.number().default(5),
  }),
  outputSchema: z.object({ jobId: z.string(), traceId: z.string() }),
})

export const allToolDefs = [
  legalRetrieveDef, legalAnalyseDef, legalDraftDef, legalValidateDef,
  legalDebateDef, legalPrivacyDef, legalAuditDef, legalOrchestrateDef,
  legalMonitorDef, legalIndexDef, legalTestDef,
]
