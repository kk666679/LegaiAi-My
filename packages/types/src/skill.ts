/**
 * @lawmate/types — Skill contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, CapabilitySchema, RiskLevelSchema, MetadataSchema } from './common';

/** Skill manifest — reusable declarative capability. */
export const SkillManifestSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(128),
  version: VersionSchema,
  description: z.string().max(1024).optional(),
  inputs: z.record(z.string(), z.unknown()).default({}),
  outputs: z.record(z.string(), z.unknown()).default({}),
  requiredCapabilities: z.array(CapabilitySchema).default([]),
  permissions: z.array(CapabilitySchema).default([]),
  safety: z.object({
    riskLevel: RiskLevelSchema.default('low'),
    hitlLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(1),
    allowedDataClasses: z.array(z.enum(['public', 'internal', 'confidential', 'privileged'])).default(['public', 'internal']),
  }).default({
    riskLevel: 'low',
    hitlLevel: 1,
    allowedDataClasses: ['public', 'internal'],
  }),
  dependencies: z.array(IdSchema).default([]),
  examples: z.array(z.record(z.string(), z.unknown())).default([]),
  tests: z.array(z.string()).default([]),
  metadata: MetadataSchema.default({}),
});
export type SkillManifest = z.infer<typeof SkillManifestSchema>;

/** Skill invocation. */
export const SkillInvocationSchema = z.object({
  id: z.string(),
  skillId: IdSchema,
  agentId: IdSchema,
  input: z.record(z.string(), z.unknown()),
  output: z.record(z.string(), z.unknown()).optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
});
export type SkillInvocation = z.infer<typeof SkillInvocationSchema>;