import { z } from 'zod'

export const AgentEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('retrieval.requested'), traceId: z.string(), query: z.string() }),
  z.object({ type: z.literal('retrieval.completed'), traceId: z.string(), query: z.string(), results: z.any(), count: z.number().optional() }),
  z.object({ type: z.literal('analysis.started'), traceId: z.string(), task: z.string() }),
  z.object({ type: z.literal('analysis.finished'), traceId: z.string(), summary: z.string(), confidence: z.number().optional() }),
  z.object({ type: z.literal('draft.requested'), traceId: z.string(), docType: z.string() }),
  z.object({ type: z.literal('draft.generated'), traceId: z.string(), draftId: z.string(), draft: z.string() }),
  z.object({ type: z.literal('validation.completed'), traceId: z.string(), citation: z.string(), status: z.string() }),
  z.object({ type: z.literal('indexing.completed'), traceId: z.string(), collection: z.string(), count: z.number() }),
  z.object({ type: z.literal('debate.completed'), traceId: z.string(), winner: z.string(), debateId: z.string() }),
  z.object({ type: z.literal('swarm.completed'), traceId: z.string(), swarmId: z.string(), results: z.any() }),
  z.object({ type: z.literal('alert.sent'), traceId: z.string(), title: z.string(), topic: z.string() }),
  z.object({ type: z.literal('feedback.submitted'), traceId: z.string(), rating: z.number(), comment: z.string().optional() }),
])

export type AgentEvent = z.infer<typeof AgentEventSchema>
