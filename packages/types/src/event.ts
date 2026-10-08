/**
 * @lawmate/types — Event model.
 */
import { z } from 'zod';
import { IdSchema, TimestampSchema, MetadataSchema, ActorSchema, TenantContextSchema } from './common';

export const EventEnvelopeSchema = z.object({
  id: IdSchema,
  type: z.string(),
  timestamp: TimestampSchema,
  source: IdSchema,
  actor: ActorSchema.optional(),
  tenant: TenantContextSchema.optional(),
  correlationId: IdSchema,
  causationId: IdSchema.optional(),
  payload: z.record(z.string(), z.unknown()).default({}),
  metadata: MetadataSchema.default({}),
});
export type EventEnvelope = z.infer<EventEnvelopeSchema>;

export const EventTypeSchema = z.enum([
  'AgentStarted',
  'AgentCompleted',
  'AgentFailed',
  'TaskCreated',
  'TaskCompleted',
  'TaskFailed',
  'TaskCancelled',
  'ToolInvoked',
  'ToolCompleted',
  'ToolFailed',
  'EvidenceCreated',
  'MemoryStored',
  'MemoryRecalled',
  'MemoryExpired',
  'LearningRunStarted',
  'LearningProposalCreated',
  'LearningProposalApproved',
  'LearningArtifactDeployed',
  'EvaluationCompleted',
  'PolicyDenied',
  'ApprovalRequired',
  'DatasetCreated',
  'DatasetValidated',
  'RegistryRegistered',
  'RegistryDeprecated',
  'RegistryRevoked',
  'AdapterRegistered',
  'AdapterHealthChanged',
  'CommsMessageSent',
  'CommsMessageDelivered',
  'BuildStarted',
  'BuildCompleted',
]);
export type EventType = z.infer<EventTypeSchema>;