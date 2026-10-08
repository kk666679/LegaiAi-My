/**
 * @lawmate/types — Tool contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, RiskLevelSchema, CapabilitySchema, MetadataSchema, DecisionSchema } from './common';

/** Tool manifest — every tool must declare schema, permissions, safety. */
export const ToolManifestSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(128),
  version: VersionSchema,
  description: z.string().max(1024).optional(),
  inputSchema: z.record(z.string(), z.unknown()),
  outputSchema: z.record(z.string(), z.unknown()),
  permissions: z.array(CapabilitySchema).default([]),
  risk: RiskLevelSchema.default('low'),
  timeout: z.number().int().positive().default(30_000),
  executionPolicy: z.object({
    sandbox: z.boolean().default(false),
    cancellable: z.boolean().default(true),
    retries: z.number().int().nonnegative().default(0),
    idempotent: z.boolean().default(false),
  }).default({}),
  allowedDataClasses: z.array(z.enum(['public', 'internal', 'confidential', 'privileged'])).default(['public', 'internal']),
  metadata: MetadataSchema.default({}),
});
export type ToolManifest = z.infer<ToolManifestSchema>;

/** Tool invocation record. */
export const ToolInvocationSchema = z.object({
  id: z.string(),
  toolId: IdSchema,
  agentId: IdSchema,
  input: z.record(z.string(), z.unknown()),
  output: z.unknown().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled', 'timeout']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  durationMs: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
  policyDecision: DecisionSchema.optional(),
});
export type ToolInvocation = z.infer<ToolInvocationSchema>;