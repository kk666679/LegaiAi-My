/**
 * @lawmate/types — KDREAM knowledge/reasoning representation.
 *
 * KDREAM is a LAWMATE-defined data/model abstraction for structured
 * knowledge/reasoning state. It is NOT claimed to be a scientifically
 * validated reasoning system.
 */
import { z } from 'zod';
import { IdSchema, TimestampSchema, MetadataSchema } from './common';

export const ConfidenceSchema = z.object({
  value: z.number().min(0).max(1),
  basis: z.string().optional(),
  sources: z.array(z.string()).default([]),
});
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const ConceptSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(256),
  description: z.string().max(2048).optional(),
  aliases: z.array(z.string()).default([]),
  domain: z.string().optional(),
  metadata: MetadataSchema.default({}),
});
export type Concept = z.infer<typeof ConceptSchema>;

export const ObservationSchema = z.object({
  id: IdSchema,
  content: z.string(),
  source: z.string(),
  observedAt: TimestampSchema,
  confidence: ConfidenceSchema.optional(),
  provenance: z.array(z.string()).default([]),
  metadata: MetadataSchema.default({}),
});
export type Observation = z.infer<typeof ObservationSchema>;

export const HypothesisSchema = z.object({
  id: IdSchema,
  statement: z.string(),
  status: z.enum(['proposed', 'testing', 'supported', 'refuted', 'inconclusive']),
  confidence: ConfidenceSchema.optional(),
  evidenceIds: z.array(IdSchema).default([]),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type Hypothesis = z.infer<typeof HypothesisSchema>;

export const GoalSchema = z.object({
  id: IdSchema,
  description: z.string(),
  status: z.enum(['active', 'achieved', 'abandoned', 'blocked']),
  priority: z.number().int().default(0),
  deadline: TimestampSchema.optional(),
  dependencies: z.array(IdSchema).default([]),
  createdAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type Goal = z.infer<typeof GoalSchema>;

export const PlanSchema = z.object({
  id: IdSchema,
  goalId: IdSchema,
  steps: z.array(z.object({
    id: z.string(),
    description: z.string(),
    status: z.enum(['pending', 'running', 'completed', 'failed']),
    dependsOn: z.array(z.string()).default([]),
  })).default([]),
  status: z.enum(['draft', 'active', 'completed', 'failed']),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Plan = z.infer<typeof PlanSchema>;

export const DecisionSchema2 = z.object({
  id: IdSchema,
  decision: z.string(),
  rationale: z.string().optional(),
  alternatives: z.array(z.string()).default([]),
  confidence: ConfidenceSchema.optional(),
  evidenceIds: z.array(IdSchema).default([]),
  approvedBy: z.string().optional(),
  decidedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type Decision = z.infer<typeof DecisionSchema2>;

export const KDREAMStateSchema = z.object({
  id: IdSchema,
  context: z.string().optional(),
  entities: z.array(IdSchema).default([]),
  concepts: z.array(ConceptSchema).default([]),
  observations: z.array(ObservationSchema).default([]),
  hypotheses: z.array(HypothesisSchema).default([]),
  goals: z.array(GoalSchema).default([]),
  plans: z.array(PlanSchema).default([]),
  decisions: z.array(DecisionSchema2).default([]),
  evidence: z.array(IdSchema).default([]),
  provenance: z.array(z.string()).default([]),
  confidence: ConfidenceSchema.optional(),
  updatedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type KDREAMState = z.infer<typeof KDREAMStateSchema>;

export const ReasoningTraceSchema = z.object({
  id: IdSchema,
  stateId: IdSchema,
  steps: z.array(z.object({
    step: z.number().int(),
    type: z.string(),
    input: z.record(z.string(), z.unknown()),
    output: z.record(z.string(), z.unknown()),
    timestamp: TimestampSchema,
  })).default([]),
  createdAt: TimestampSchema,
});
export type ReasoningTrace = z.infer<typeof ReasoningTraceSchema>;