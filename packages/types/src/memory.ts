/**
 * @lawmate/types — Memory contract.
 */
import { z } from 'zod';
import { IdSchema, RetentionPolicySchema, ActorSchema } from './common';

export const MemoryTypeSchema = z.enum([
  'working',
  'episodic',
  'semantic',
  'procedural',
  'user-project',
  'session',
]);
export type MemoryType = z.infer<MemoryTypeSchema>;

export const MemoryRecordSchema = z.object({
  id: IdSchema,
  agentId: IdSchema,
  type: MemoryTypeSchema,
  key: z.string().max(256),
  content: z.string(),
  summary: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  tenantId: z.string().optional(),
  projectId: z.string().optional(),
  actorId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  retention: RetentionPolicySchema.optional(),
  provenance: z.array(z.string()).default([]),
});
export type MemoryRecord = z.infer<MemoryRecordSchema>;

export const MemoryQuerySchema = z.object({
  agentId: IdSchema,
  type: MemoryTypeSchema.optional(),
  query: z.string().optional(),
  key: z.string().optional(),
  limit: z.number().int().positive().default(10),
  tenantId: z.string().optional(),
  projectId: z.string().optional(),
});
export type MemoryQuery = z.infer<MemoryQuerySchema>;

export const MemoryResultSchema = z.object({
  records: z.array(MemoryRecordSchema),
  total: z.number().int().nonnegative(),
});
export type MemoryResult = z.infer<MemoryResultSchema>;