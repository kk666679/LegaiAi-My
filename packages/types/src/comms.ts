/**
 * @lawmate/types — Comms contract.
 */
import { z } from 'zod';
import { IdSchema, TimestampSchema, MetadataSchema, ActorSchema, TenantContextSchema } from './common';

export const MessagePrioritySchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9)]);
export type MessagePriority = z.infer<MessagePrioritySchema>;

export const MessageEnvelopeSchema = z.object({
  id: IdSchema,
  type: z.string(),
  source: IdSchema,
  destination: IdSchema,
  actor: ActorSchema.optional(),
  tenant: TenantContextSchema.optional(),
  correlationId: IdSchema,
  causationId: IdSchema.optional(),
  timestamp: TimestampSchema,
  ttl: z.number().int().positive().optional(),
  priority: MessagePrioritySchema.default(5),
  payload: z.record(z.string(), z.unknown()).default({}),
  metadata: MetadataSchema.default({}),
});
export type MessageEnvelope = z.infer<MessageEnvelopeSchema>;

export const DeliveryStatusSchema = z.enum(['sent', 'delivered', 'acknowledged', 'failed', 'dead-letter']);
export type DeliveryStatus = z.infer<DeliveryStatusSchema>;

export const TransportSchema = z.enum(['in-memory', 'redis', 'nats', 'rabbitmq', 'cloud']);
export type Transport = z.infer<TransportSchema>;