/**
 * @lawmate/types — Build/autobuild contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, TimestampSchema, MetadataSchema } from './common';

export const BuildStepStatusSchema = z.enum(['pending', 'running', 'completed', 'failed', 'skipped']);
export type BuildStepStatus = z.infer<typeof BuildStepStatusSchema>;

export const BuildStepSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  command: z.string(),
  status: BuildStepStatusSchema.default('pending'),
  startedAt: TimestampSchema.optional(),
  completedAt: TimestampSchema.optional(),
  durationMs: z.number().int().nonnegative().optional(),
  exitCode: z.number().int().optional(),
  output: z.string().optional(),
  error: z.string().optional(),
});
export type BuildStep = z.infer<typeof BuildStepSchema>;

export const BuildResultSchema = z.enum(['success', 'failed', 'cancelled']);
export type BuildResult = z.infer<typeof BuildResultSchema>;

export const BuildPlanSchema = z.object({
  id: IdSchema,
  name: z.string(),
  steps: z.array(BuildStepSchema).default([]),
  policy: z.record(z.string(), z.unknown()).default({}),
  createdAt: TimestampSchema,
});
export type BuildPlan = z.infer<typeof BuildPlanSchema>;

export const BuildArtifactSchema = z.object({
  id: IdSchema,
  buildId: IdSchema,
  type: z.string(),
  name: z.string(),
  version: VersionSchema,
  sizeBytes: z.number().int().nonnegative().optional(),
  hash: z.string().optional(),
  path: z.string().optional(),
  provenance: z.array(z.string()).default([]),
  metadata: MetadataSchema.default({}),
  createdAt: TimestampSchema,
});
export type BuildArtifact = z.infer<typeof BuildArtifactSchema>;

export const BuildSchema = z.object({
  id: IdSchema,
  planId: IdSchema,
  sourceRevision: z.string(),
  environment: z.string(),
  status: z.enum(['planned', 'running', 'completed', 'failed', 'cancelled']),
  result: BuildResultSchema.optional(),
  steps: z.array(BuildStepSchema).default([]),
  artifacts: z.array(BuildArtifactSchema).default([]),
  startedAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  logs: z.string().optional(),
  provenance: z.array(z.string()).default([]),
});
export type Build = z.infer<typeof BuildSchema>;