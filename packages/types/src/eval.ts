/**
 * @lawmate/types — Evaluation contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, TimestampSchema, MetadataSchema } from './common';

export const MetricSchema = z.object({
  name: z.string(),
  value: z.number(),
  unit: z.string().optional(),
  threshold: z.number().optional(),
  passed: z.boolean().optional(),
});
export type Metric = z.infer<typeof MetricSchema>;

export const EvalCaseSchema = z.object({
  id: IdSchema,
  name: z.string(),
  input: z.record(z.string(), z.unknown()),
  expectedOutput: z.record(z.string(), z.unknown()).optional(),
  rubric: z.string().optional(),
  metadata: MetadataSchema.default({}),
});
export type EvalCase = z.infer<typeof EvalCaseSchema>;

export const EvalRunSchema = z.object({
  id: IdSchema,
  targetId: IdSchema,
  targetType: z.enum(['agent', 'skill', 'tool', 'workflow', 'model']),
  datasetId: IdSchema,
  evaluatorIds: z.array(IdSchema).default([]),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  metrics: z.array(MetricSchema).default([]),
  startedAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  metadata: MetadataSchema.default({}),
});
export type EvalRun = z.infer<typeof EvalRunSchema>;

export const EvaluatorSchema = z.object({
  id: IdSchema,
  name: z.string(),
  version: VersionSchema,
  description: z.string().optional(),
  metricNames: z.array(z.string()).default([]),
  config: z.record(z.string(), z.unknown()).default({}),
});
export type Evaluator = z.infer<typeof EvaluatorSchema>;

export const BenchmarkSchema = z.object({
  id: IdSchema,
  name: z.string(),
  version: VersionSchema,
  description: z.string().optional(),
  cases: z.array(EvalCaseSchema).default([]),
  metadata: MetadataSchema.default({}),
});
export type Benchmark = z.infer<typeof BenchmarkSchema>;