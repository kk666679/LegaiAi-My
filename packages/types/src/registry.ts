/**
 * @lawmate/types — Registry contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, CapabilitySchema, MetadataSchema, TimestampSchema } from './common';

export const RegistryEntrySchema = z.object({
  id: IdSchema,
  name: z.string(),
  kind: z.enum(['agent', 'skill', 'tool', 'model', 'provider', 'dataset', 'evaluator', 'policy', 'connector', 'workflow', 'plugin', 'adapter']),
  version: VersionSchema,
  description: z.string().max(2048).optional(),
  capabilities: z.array(CapabilitySchema).default([]),
  dependencies: z.array(IdSchema).default([]),
  compatibility: z.array(VersionSchema).default([]),
  status: z.enum(['active', 'deprecated', 'disabled', 'revoked']).default('active'),
  publisher: z.string().optional(),
  owner: z.string().optional(),
  provenance: z.array(z.string()).default([]),
  signature: z.string().optional(),
  health: z.object({
    status: z.enum(['healthy', 'degraded', 'unhealthy', 'unknown']).default('unknown'),
    lastCheck: TimestampSchema.optional(),
    error: z.string().optional(),
  }).optional(),
  metadata: MetadataSchema.default({}),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type RegistryEntry = z.infer<RegistryEntrySchema>;

export const RegistryQuerySchema = z.object({
  kind: z.string().optional(),
  capability: CapabilitySchema.optional(),
  status: z.string().optional(),
  version: VersionSchema optional,
  limit: z.number().int().positive().default(50),
  cursor: z.string().optional(),
});
export type RegistryQuery = z.infer<RegistryQuerySchema>;

export const RegistrySearchResultSchema = z.object({
  entries: z.array(RegistryEntrySchema),
  total: z.number().int().nonnegative(),
  nextCursor: z.string().optional(),
});
export type RegistrySearchResult = z.infer<RegistrySearchResultSchema>;