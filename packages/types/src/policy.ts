/**
 * @lawmate/types — Policy contract.
 */
import { z } from 'zod';
import { IdSchema, DecisionSchema, CapabilitySchema, RiskLevelSchema, DataClassSchema } from './common';

export const PolicyRuleSchema = z.object({
  id: IdSchema,
  name: z.string(),
  description: z.string().optional(),
  action: z.string(),
  subject: z.string(),
  conditions: z.record(z.string(), z.unknown()).default({}),
  decision: DecisionSchema,
  priority: z.number().int().default(0),
  enabled: z.boolean().default(true),
});
export type PolicyRule = z.infer<PolicyRuleSchema>;

export const PolicySchema = z.object({
  id: IdSchema,
  name: z.string(),
  version: z.string(),
  description: z.string().optional(),
  rules: z.array(PolicyRuleSchema).default([]),
  enabled: z.boolean().default(true),
  metadata: z.record(z.string(), z.unknown()).default({}),
});
export type Policy = z.infer<PolicySchema>;

export const PolicyEvaluationRequestSchema = z.object({
  actor: z.string(),
  action: z.string(),
  resource: z.string(),
  context: z.record(z.string(), z.unknown()).default({}),
  capabilities: z.array(CapabilitySchema).default([]),
  dataClass: DataClassSchema.optional(),
  riskLevel: RiskLevelSchema.optional(),
});
export type PolicyEvaluationRequest = z.infer<PolicyEvaluationRequestSchema>;

export const PolicyEvaluationResultSchema = z.object({
  decision: DecisionSchema,
  matchedRules: z.array(IdSchema).default([]),
  reason: z.string().optional(),
  requiresApproval: z.boolean().default(false),
  redactFields: z.array(z.string()).default([]),
  escalateTo: z.string().optional(),
});
export type PolicyEvaluationResult = z.infer<PolicyEvaluationResultSchema>;