/**
 * @lawmate/types — Agent contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, CapabilitySchema, RiskLevelSchema, ActorSchema, MetadataSchema, DecisionSchema } from './common';

/** Agent manifest — every agent must declare capabilities. */
export const AgentManifestSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(128),
  version: VersionSchema,
  description: z.string().max(1024).optional(),
  capabilities: z.array(CapabilitySchema).default([]),
  skills: z.array(IdSchema).default([]),
  tools: z.array(IdSchema).default([]),
  memory: z.object({
    enabled: z.boolean().default(false),
    types: z.array(z.string()).default([]),
    retention: z.object({
      ttlSeconds: z.number().int().positive().optional(),
      autoDelete: z.boolean().default(false),
      redactSensitive: z.boolean().default(true),
    }).optional(),
  }).optional(),
  safety: z.object({
    hitlLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).default(1),
    riskLevel: RiskLevelSchema.default('low'),
    maxToolCallsPerTask: z.number().int().positive().default(50),
    maxDurationMs: z.number().int().positive().default(300_000),
    allowedDataClasses: z.array(z.enum(['public', 'internal', 'confidential', 'privileged'])).default(['public', 'internal']),
  }).default({}),
  limits: z.object({
    maxConcurrentTasks: z.number().int().positive().default(5),
    maxMemoryBytes: z.number().int().positive().default(256 * 1024 * 1024),
  }).default({}),
  metadata: MetadataSchema.default({}),
});
export type AgentManifest = z.infer<AgentManifestSchema>;

/** Runtime agent state. */
export const AgentStateSchema = z.object({
  id: IdSchema,
  status: z.enum(['initializing', 'idle', 'busy', 'degraded', 'stopped', 'failed']),
  currentTaskId: z.string().optional(),
  capabilities: z.array(CapabilitySchema),
  loadedAt: z.string().datetime(),
  lastActivityAt: z.string().datetime().optional(),
  errorCount: z.number().int().nonnegative().default(0),
  metadata: MetadataSchema.default({}),
});
export type AgentState = z.infer<AgentStateSchema>;

/** Agent task. */
export const AgentTaskSchema = z.object({
  id: z.string(),
  agentId: IdSchema,
  type: z.string(),
  input: z.record(z.string(), z.unknown()),
  context: z.object({
    tenantId: z.string().optional(),
    projectId: z.string().optional(),
    actorId: z.string().optional(),
    correlationId: z.string(),
    causationId: z.string().optional(),
  }),
  status: z.enum(['pending', 'running', 'awaiting-approval', 'completed', 'failed', 'cancelled']),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  error: z.string().optional(),
  output: z.record(z.string(), z.unknown()).optional(),
});
export type AgentTask = z.infer<AgentTaskSchema>;

/** Agent delegation record. */
export const AgentDelegationSchema = z.object({
  id: z.string(),
  fromAgentId: IdSchema,
  toAgentId: IdSchema,
  taskId: z.string(),
  reason: z.string().optional(),
  permissions: z.array(CapabilitySchema).default([]),
  createdAt: z.string().datetime(),
});
export type AgentDelegation = z.infer<AgentDelegationSchema>;

/** Agent policy. */
export const AgentPolicySchema = z.object({
  agentId: IdSchema,
  permissions: z.array(CapabilitySchema),
  deniedCapabilities: z.array(CapabilitySchema).default([]),
  requireApprovalFor: z.array(CapabilitySchema).default([]),
  dataClassLimits: z.array(z.enum(['public', 'internal', 'confidential', 'privileged'])).default(['public', 'internal']),
});
export type AgentPolicy = z.infer<AgentPolicySchema>;

/** Agent output envelope. */
export const AgentOutputSchema = z.object({
  taskId: z.string(),
  agentId: IdSchema,
  type: z.string(),
  content: z.unknown(),
  provenance: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).optional(),
  evidenceIds: z.array(IdSchema).default([]),
  timestamp: z.string().datetime(),
});
export type AgentOutput = z.infer<AgentOutputSchema>;