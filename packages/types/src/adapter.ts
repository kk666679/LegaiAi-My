/**
 * @lawmate/types — Adapter contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, MetadataSchema, TimestampSchema } from './common';

export const AdapterCapabilitySchema = z.string();
export type AdapterCapability = z.infer<typeof AdapterCapabilitySchema>;

export const AdapterManifestSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(128),
  version: VersionSchema,
  provider: z.string(),
  capabilities: z.array(AdapterCapabilitySchema).default([]),
  configSchema: z.record(z.string(), z.unknown()).default({}),
  description: z.string().max(1024).optional(),
  metadata: MetadataSchema.default({}),
});
export type AdapterManifest = z.infer<typeof AdapterManifestSchema>;

export const AdapterHealthSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']),
  checkedAt: TimestampSchema,
  latencyMs: z.number().int().nonnegative().optional(),
  error: z.string().optional(),
  details: MetadataSchema.default({}),
});
export type AdapterHealth = z.infer<typeof AdapterHealthSchema>;

export const AdapterStatusSchema = z.enum(['discovered', 'registered', 'validated', 'initialized', 'active', 'paused', 'disabled', 'shutdown', 'removed']);
export type AdapterStatus = z.infer<typeof AdapterStatusSchema>;