/**
 * @lawmate/types — Execution contracts.
 */
import { z } from 'zod';
import { IdSchema, TimestampSchema, MetadataSchema, ActorSchema, TenantContextSchema } from './common';

export const ExecutionContextSchema = z.object({
  requestId: IdSchema,
  correlationId: IdSchema,
  causationId: IdSchema.optional(),
  actor: ActorSchema,
  tenant: TenantContextSchema.optional(),
  startedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
  traceId: z.string().optional(),
  spanId: z.string().optional(),
});
export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

export const TaskGraphSchema = z.object({
  id: IdSchema,
  name: z.string(),
  steps: z.array(z.object({
    id: z.string(),
    type: z.string(),
    agentId: IdSchema.optional(),
    toolId: IdSchema.optional(),
    skillId: IdSchema.optional(),
    dependsOn: z.array(z.string()).default([]),
    input: z.record(z.string(), z.unknown()).default({}),
    timeout: z.number().int().positive().optional(),
    retryPolicy: z.object({
      maxRetries: z.number().int().nonnegative().default(0),
      backoffMs: z.number().int().positive().default(1000),
    }).optional(),
  })).default([]),
  metadata: MetadataSchema.default({}),
});
export type TaskGraph = z.infer<typeof TaskGraphSchema>;

export const JobSchema = z.object({
  id: IdSchema,
  queue: z.string(),
  type: z.string(),
  payload: z.record(z.string(), z.unknown()),
  priority: z.number().int().default(0),
  delay: z.number().int().default(0),
  attempts: z.number().int().nonnegative().default(0),
  maxAttempts: z.number().int().nonnegative().default(3),
  timeout: z.number().int().positive().optional(),
  status: z.enum(['waiting', 'active', 'completed', 'failed', 'delayed', 'dead-letter']),
  createdAt: TimestampSchema,
  startedAt: TimestampSchema.optional(),
  completedAt: TimestampSchema.optional(),
  error: z.string().optional(),
  result: z.record(z.string(), z.unknown()).optional(),
});
export type Job = z.infer<typeof JobSchema>;

export const WorkflowSchema = z.object({
  id: IdSchema,
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  steps: z.array(z.string()).default([]),
  metadata: MetadataSchema.default({}),
});
export type Workflow = z.infer<typeof WorkflowSchema>;