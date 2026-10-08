/**
 * @lawmate/types — Audit event contract (supplement to common).
 */
import { z } from 'zod';
import { IdSchema, TimestampSchema, DecisionSchema, ActorSchema } from './common';

export const AuditCategorySchema = z.enum([
  'tool-invocation',
  'agent-execution',
  'policy-decision',
  'memory-access',
  'knowledge-mutation',
  'dataset-mutation',
  'learning',
  'evaluation',
  'deployment',
  'registry-change',
  'adapter-operation',
  'comms-message',
  'build',
]);
export type AuditCategory = z.infer<AuditCategorySchema>;

export const AuditEventSchema = z.object({
  id: IdSchema,
  timestamp: TimestampSchema,
  category: AuditCategorySchema,
  actor: ActorSchema,
  action: z.string(),
  resource: z.string(),
  decision: DecisionSchema,
  details: z.record(z.string(), z.unknown()).default({}),
  requestId: z.string().optional(),
  correlationId: z.string().optional(),
});
export type AuditEvent = z.infer<AuditEventSchema>;