/**
 * @lawmate/types — Agent contract.
 */
import { z } from 'zod';
import {
  IdSchema,
  VersionSchema,
  CapabilitySchema,
  RiskLevelSchema,
  MetadataSchema,
  TimestampSchema,
  DataClassSchema,
  ConfidenceSchema,
  HitlLevelSchema,
} from './common';

const AgentSafetySchema = z.object({
  hitlLevel: HitlLevelSchema.default(1),
  riskLevel: RiskLevelSchema.default('low'),
  maxToolCallsPerTask: z.number().int().positive().default(10),
  maxDurationMs: z.number().int().positive().default(60_000),
  allowedDataClasses: z.array(DataClassSchema).default(['public', 'internal']),
});

const AgentLimitsSchema = z.object({
  maxConcurrentTasks: z.number().int().positive().default(4),
  maxMemoryBytes: z.number().int().positive().default(256 * 1024 * 1024),
});

export const AgentManifestSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(128),
  version: VersionSchema,
  description: z.string().max(1024).optional(),
  capabilities: z.array(CapabilitySchema).default([]),
  tools: z.array(IdSchema).default([]),
  skills: z.array(IdSchema).default([]),
  safety: AgentSafetySchema.default({
    hitlLevel: 1,
    riskLevel: 'low',
    maxToolCallsPerTask: 10,
    maxDurationMs: 60_000,
    allowedDataClasses: ['public', 'internal'],
  }),
  limits: AgentLimitsSchema.default({
    maxConcurrentTasks: 4,
    maxMemoryBytes: 256 * 1024 * 1024,
  }),
  metadata: MetadataSchema.default({}),
});
export type AgentManifest = z.infer<typeof AgentManifestSchema>;

export const AgentStateSchema = z.enum([
  'idle',
  'planning',
  'executing',
  'waiting',
  'paused',
  'completed',
  'failed',
  'cancelled',
]);
export type AgentState = z.infer<typeof AgentStateSchema>;

export const AgentTaskSchema = z.object({
  id: IdSchema,
  agentId: IdSchema,
  input: z.record(z.string(), z.unknown()),
  status: z.enum(['queued', 'running', 'completed', 'failed', 'cancelled']),
  startedAt: TimestampSchema,
  completedAt: TimestampSchema.optional(),
  result: z.record(z.string(), z.unknown()).optional(),
  error: z.string().optional(),
  confidence: ConfidenceSchema.optional(),
});
export type AgentTask = z.infer<typeof AgentTaskSchema>;

export const AgentDelegationSchema = z.object({
  fromAgentId: IdSchema,
  toAgentId: IdSchema,
  taskId: IdSchema,
  reason: z.string().optional(),
  delegatedAt: TimestampSchema,
});
export type AgentDelegation = z.infer<typeof AgentDelegationSchema>;

export const AgentPolicySchema = z.object({
  agentId: IdSchema,
  allowedActions: z.array(z.string()).default([]),
  deniedActions: z.array(z.string()).default([]),
  requireApprovalFor: z.array(z.string()).default([]),
  updatedAt: TimestampSchema,
});
export type AgentPolicy = z.infer<typeof AgentPolicySchema>;

export const AgentOutputSchema = z.object({
  taskId: IdSchema,
  agentId: IdSchema,
  content: z.string(),
  confidence: ConfidenceSchema.optional(),
  evidence: z.array(z.string()).default([]),
  producedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type AgentOutput = z.infer<typeof AgentOutputSchema>;
