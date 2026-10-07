/**
 * Agent 3: Legal Drafting Agent
 * Supports 11 document types:
 *   Legacy (inline):  WRIT | AFFIDAVIT | SUBMISSION | COMPLAINT
 *   Template-driven:  STATEMENT_OF_CLAIM | DEFENCE | NOTICE_OF_APPEAL |
 *                     SKELETAL_ARGUMENTS | CONSENT_ORDER | SUMMONS | ENFORCEMENT_NOTICE
 */
import { Worker } from 'bullmq'
import ollama from 'ollama'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { prisma } from '@/backend/src/db/index.js'
import { agentLogger } from '@/backend/src/lib/logger.js'
import { writeAuditLog } from '@/backend/src/lib/audit.js'
import { signOutput } from '@/backend/src/lib/crypto.js'
import { readTemplatePrompt, readTemplateSchema } from '@/backend/src/templates/registry.js'
import { render } from '@/backend/src/templates/render.js'
import { jobService } from '@/backend/src/lib/jobs.js'
import { classifyError, DEFAULT_REDIS_CONNECTION } from '@/backend/src/lib/worker-utils.js'

const log = agentLogger('legal-drafting')
const connection = DEFAULT_REDIS_CONNECTION

const ETHICS_DISCLAIMER = `\n\n---\n⚠️ ETHICS NOTICE: This document is AI-generated and requires review, approval, and signature by a qualified Malaysian lawyer before use in any legal proceeding. It does not constitute legal advice.`

// Map tRPC docType enum → template registry ID
const DOC_TYPE_TO_TEMPLATE_ID = {
  STATEMENT_OF_CLAIM:  'statement_of_claim',
  DEFENCE:             'defence',
  NOTICE_OF_APPEAL:    'notice_of_appeal',
  SKELETAL_ARGUMENTS:  'skeletal_arguments',
  CONSENT_ORDER:       'consent_order',
  SUMMONS:             'summons_with_affidavit',
  ENFORCEMENT_NOTICE:  'enforcement_notice',
}

const LEGACY_DOC_TYPES = new Set(['WRIT', 'AFFIDAVIT', 'SUBMISSION', 'COMPLAINT'])

const LEGACY_HEADERS = {
  WRIT:       (p) => `# WRIT OF SUMMONS\n\nIN THE ${p.court.toUpperCase()}\nCIVIL SUIT NO: ${p.caseNumber || '[TO BE ASSIGNED]'}\n\nBETWEEN\n\n**${p.plaintiff}** — Plaintiff\n\nAND\n\n**${p.defendant}** — Defendant`,
  AFFIDAVIT:  (p) => `# AFFIDAVIT\n\nI, **${p.plaintiff}**, do hereby solemnly affirm and state as follows:`,
  SUBMISSION: (p) => `# WRITTEN SUBMISSION\n\nIN THE ${p.court.toUpperCase()}\n\n**${p.plaintiff}** v **${p.defendant}**`,
  COMPLAINT:  (p) => `# CIVIL RIGHTS COMPLAINT\n\nComplainant: **${p.plaintiff}**\nRespondent: **${p.defendant}**\nForum: ${p.court}`,
}

const MLJ_REGEX = /\[\d{4}\]\s+\d+\s+MLJ\s+\d+/

function validateMLJCitations(citations) {
  return citations.map(c => ({
    citation: c,
    valid: MLJ_REGEX.test(c),
    format: MLJ_REGEX.test(c) ? 'MLJ compliant' : 'Non-standard — check format',
  }))
}

const DraftInputSchema = z.object({
  docType: z.enum([
    'WRIT', 'AFFIDAVIT', 'SUBMISSION', 'COMPLAINT',
    'STATEMENT_OF_CLAIM', 'DEFENCE', 'NOTICE_OF_APPEAL',
    'SKELETAL_ARGUMENTS', 'CONSENT_ORDER', 'SUMMONS', 'ENFORCEMENT_NOTICE',
  ]).optional(),
  templateId: z.string().optional(),
  inputData: z.record(z.unknown()).optional(),
  iracText: z.string().optional(),
  tone: z.enum(['adversarial', 'neutral', 'persuasive']).default('neutral'),
  format: z.enum(['markdown', 'docx', 'pdf']).default('markdown'),
  parties: z.object({
    plaintiff: z.string(),
    defendant: z.string(),
    court: z.string(),
    caseNumber: z.string().optional(),
  }).optional(),
  facts: z.string().optional(),
  reliefSought: z.string().optional(),
  citations: z.array(z.string()).default([]),
  traceId: z.string().default(() => randomUUID()),
  userId: z.string().optional(),
  orgId: z.string().optional(),
  jobId: z.string().optional(),
  draftId: z.string().optional(),
})

const TONE_INSTRUCTIONS = {
  adversarial: "Write in a forceful, assertive legal style emphasising the strength of the client's position.",
  neutral:     'Write in a balanced, objective legal style suitable for court submissions.',
  persuasive:  'Write in a compelling, persuasive style that builds a logical narrative toward the relief sought.',
}

const LLM_TIMEOUT = 180000

async function draftLegacy({ docType, tone, parties, facts, reliefSought, citations }) {
  const header = LEGACY_HEADERS[docType](parties)
  const prompt = `You are a Malaysian legal drafter. Draft the body of a ${docType} document.

Style: ${TONE_INSTRUCTIONS[tone]}
Facts: ${facts}
Relief Sought: ${reliefSought || 'As per applicable law'}
Citations to use (MLJ format): ${citations.join(', ') || 'None provided'}

Requirements:
- Use Malaysian legal terminology
- Cite cases as [YYYY] N MLJ NNN format
- Number all paragraphs
- Do NOT invent facts or cases not provided
- Output only the document body (no header)`

  const res = await Promise.race([
    ollama.chat({
      model: process.env.LLM_MODEL || 'llama3.1',
      messages: [{ role: 'user', content: prompt }],
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), LLM_TIMEOUT)),
  ])
  return `${header}\n\n${res.message.content}`
}

async function draftFromTemplate({ templateId, inputData, iracText, citations, tone }) {
  const promptTemplate = readTemplatePrompt(templateId)

  // Render the prompt template with inputData + iracText + citations
  const renderedPrompt = render(promptTemplate, {
    ...inputData,
    iracText: iracText || '',
    citations: citations || [],
  })

  // Prepend tone instruction
  const fullPrompt = `Style: ${TONE_INSTRUCTIONS[tone]}\n\n${renderedPrompt}`

  const res = await Promise.race([
    ollama.chat({
      model: process.env.LLM_MODEL || 'llama3.1',
      messages: [{ role: 'user', content: fullPrompt }],
    }),
    new Promise((_, reject) => setTimeout(() => reject(new Error('LLM timeout')), LLM_TIMEOUT)),
  ])
  return res.message.content
}

const worker = new Worker('legal-drafting', async (job) => {
  const parsed = DraftInputSchema.safeParse(job.data)
  if (!parsed.success) {
    log.error({ errors: parsed.error.issues }, 'Invalid draft input')
    throw new Error(`Validation failed: ${JSON.stringify(parsed.error.issues)}`)
  }

  const { docType, templateId, inputData, iracText, tone, format, parties, facts, reliefSought, citations, traceId, userId, orgId, jobId, draftId } = parsed.data
  const start = Date.now()
  log.info({ traceId, docType: docType || templateId, tone, jobId }, 'Drafting started')

  let unifiedJob = null
  if (jobId) {
    unifiedJob = await jobService.getById(jobId)
    if (unifiedJob) {
      await jobService.markRunning(unifiedJob.id, `worker-${process.pid}`)
    }
  }

  try {
    const citationCheck = validateMLJCitations(citations)
    const invalidCitations = citationCheck.filter(c => !c.valid)
    if (invalidCitations.length > 0) log.warn({ traceId, invalidCitations }, 'Non-MLJ citations detected')

    let content

    // Route: explicit templateId > docType→templateId mapping > legacy inline
    const resolvedTemplateId = templateId ?? (docType ? DOC_TYPE_TO_TEMPLATE_ID[docType] : undefined)

    await jobService.markProcessing(unifiedJob?.id || '', 'preparing', 10, 'Preparing draft inputs')

    if (resolvedTemplateId) {
      await jobService.markProcessing(unifiedJob?.id || '', 'drafting_template', 40, 'Generating draft from template')
      content = await draftFromTemplate({ templateId: resolvedTemplateId, inputData, iracText, citations, tone })
    } else if (docType && LEGACY_DOC_TYPES.has(docType)) {
      await jobService.markProcessing(unifiedJob?.id || '', 'drafting_legacy', 40, 'Generating legacy draft')
      content = await draftLegacy({ docType, tone, parties, facts, reliefSought, citations })
    } else {
      throw new Error(`Cannot resolve template for docType: ${docType}`)
    }

    await jobService.markProcessing(unifiedJob?.id || '', 'finalizing', 90, 'Finalizing document')
    const fullDoc = `${content}${ETHICS_DISCLAIMER}`
    const effectiveDocType = docType || resolvedTemplateId?.toUpperCase() || 'UNKNOWN'

    const draft = await prisma.draftDocument.create({
      data: {
        traceId, userId, orgId,
        docType: effectiveDocType,
        content: fullDoc,
        format, tone,
        citationsOk: invalidCitations.length === 0,
      },
    })

    const output = {
      traceId,
      draftId: draft.id,
      docType: effectiveDocType,
      tone, format,
      content: fullDoc,
      citationValidation: citationCheck,
      _sig: signOutput({ draftId: draft.id, traceId }),
    }

    await writeAuditLog({
      traceId, agentName: 'legal-drafting', userId, action: 'draft',
      input: { docType: effectiveDocType, tone, format, citationCount: citations.length },
      output: { draftId: draft.id, citationsOk: draft.citationsOk },
      durationMs: Date.now() - start,
    })

    if (unifiedJob) await jobService.markCompleted(unifiedJob.id, output)

    log.info({ traceId, draftId: draft.id }, 'Draft complete')
    return output
  } catch (err) {
    const error = err as Error
    const { retryable, code } = classifyError(error)
    log.error({ traceId, err: error.message, retryable, code }, 'Drafting job failed')

    await writeAuditLog({
      traceId, agentName: 'legal-drafting', userId, action: 'draft',
      input: { docType: docType || templateId, tone, format, citationCount: citations.length },
      output: { error: error.message },
      durationMs: Date.now() - start,
    })

    if (unifiedJob) {
      if (retryable && unifiedJob.attempts < unifiedJob.maxAttempts) {
        await jobService.markRetrying(unifiedJob.id, unifiedJob.attempts + 1)
        throw error
      }
      await jobService.markFailed(unifiedJob.id, error.message, code)
    }

    throw error
  }
}, { connection, concurrency: 2, maxStalledCount: 2, removeOnFail: false, removeOnComplete: false })

worker.on('failed', (job, err) => log.error({ jobId: job?.id, err: err.message }, 'Drafting job failed'))

process.on('SIGTERM', async () => {
  await worker.close()
  process.exit(0)
})

log.info('Legal Drafting Agent started (11 doc types)')