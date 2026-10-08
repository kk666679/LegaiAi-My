/**
 * @lawmate/types — Vector store contract.
 */
import { z } from 'zod';
import { IdSchema, MetadataSchema } from './common';

export const VectorRecordSchema = z.object({
  id: IdSchema,
  content: z.string(),
  embedding: z.array(z.number()),
  metadata: MetadataSchema.default({}),
  namespace: z.string().default('default'),
  tenantId: z.string().optional(),
  projectId: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});
export type VectorRecord = z.infer<typeof VectorRecordSchema>;

export const VectorSearchRequestSchema = z.object({
  query: z.string().optional(),
  embedding: z.array(z.number()).optional(),
  namespace: z.string().default('default'),
  topK: z.number().int().positive().default(10),
  filter: z.record(z.string(), z.unknown()).optional(),
  minScore: z.number().min(0).max(1).optional(),
  tenantId: z.string().optional(),
  projectId: z.string().optional(),
});
export type VectorSearchRequest = z.infer<typeof VectorSearchRequestSchema>;

export const VectorSearchResultSchema = z.object({
  id: IdSchema,
  score: z.number(),
  content: z.string().optional(),
  metadata: MetadataSchema.optional(),
});
export type VectorSearchResult = z.infer<typeof VectorSearchResultSchema>;

export const VectorCollectionSchema = z.object({
  id: IdSchema,
  name: z.string(),
  dimension: z.number().int().positive(),
  metadata: MetadataSchema.default({}),
  createdAt: z.string().datetime(),
});
export type VectorCollection = z.infer<typeof VectorCollectionSchema>;