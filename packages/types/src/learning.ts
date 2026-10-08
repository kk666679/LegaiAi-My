/**
 * @lawmate/types — Learning contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, TimestampSchema, MetadataSchema } from './common';

export const LearningExampleSchema = z.object({
  id: IdSchema,
  input: z.record(z.string(), z.unknown()),
  expectedOutput: z.record(z.string(), z.unknown()).optional(),
  outcome: z.string().optional(),
  feedback: z.string().optional(),
  source: z.string(),
  collectedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type LearningExample = z.infer<typeof LearningExampleSchema>;

export const LearningExperimentSchema = z.object({
  id: IdSchema,
  name: z.string(),
  hypothesis: z.string(),
  datasetId: IdSchema,
  baselineId: z.string().optional(),
  status: z.enum(['planned', 'running', 'completed', 'failed']),
  startedAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  results: z.record(z.string(), z.unknown()).optional(),
  metadata: MetadataSchema.default({}),
});
export type LearningExperiment = z.infer<typeof LearningExperimentSchema>;

export const LearningProposalSchema = z.object({
  id: IdSchema,
  experimentId: IdSchema,
  targetId: IdSchema,
  targetType: z.enum(['agent', 'skill', 'tool', 'policy']),
  description: z.string(),
  changes: z.record(z.string(), z.unknown()),
  expectedImpact: z.string().optional(),
  riskAssessment: z.string().optional(),
  status: z.enum(['draft', 'pending-safety', 'pending-approval', 'approved', 'rejected', 'deployed']),
  safetyReview: z.object({
    reviewed: z.boolean(),
    reviewer: z.string().optional(),
    reviewedAt: TimestampSchema.optional(),
    decision: z.enum(['pass', 'fail', 'conditional']).optional(),
    notes: z.string().optional(),
  }).optional(),
  approval: z.object({
    required: z.boolean(),
    approvedBy: z.string().optional(),
    approvedAt: TimestampSchema.optional(),
  }).optional(),
  createdAt: TimestampSchema,
});
export type LearningProposal = z.infer<typeof LearningProposalSchema>;

export const LearningArtifactSchema = z.object({
  id: IdSchema,
  proposalId: IdSchema,
  type: z.string(),
  version: VersionSchema,
  content: z.record(z.string(), z.unknown()),
  canary: z.boolean().default(false),
  deployedAt: TimestampSchema.optional(),
  metadata: MetadataSchema.default({}),
});
export type LearningArtifact = z.infer<typeof LearningArtifactSchema>;

export const LearningRunSchema = z.object({
  id: IdSchema,
  proposalId: IdSchema,
  artifactId: IdSchema,
  status: z.enum(['queued', 'running', 'completed', 'failed', 'rolled-back']),
  startedAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  outcome: z.string().optional(),
  metrics: z.record(z.string(), z.unknown()).optional(),
});
export type LearningRun = z.infer<typeof LearningRunSchema>;