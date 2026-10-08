/**
 * @lawmate/types — Evidence and provenance contract.
 */
import { z } from 'zod';
import { IdSchema, TimestampSchema, MetadataSchema, ConfidenceSchema } from './common';

export const SourceSchema = z.object({
  id: IdSchema,
  type: z.string(),
  title: z.string().optional(),
  uri: z.string().optional(),
  publisher: z.string().optional(),
  publishedAt: TimestampSchema.optional(),
  quality: z.number().min(0).max(1).optional(),
  retrievedAt: TimestampSchema,
  hash: z.string().optional(),
  metadata: MetadataSchema.default({}),
});
export type Source = z.infer<typeof SourceSchema>;

export const EvidenceSchema = z.object({
  id: IdSchema,
  claimId: IdSchema,
  sourceId: IdSchema,
  excerpt: z.string(),
  relevance: z.number().min(0).max(1).optional(),
  confidence: ConfidenceSchema.optional(),
  verified: z.boolean().default(false),
  verifiedAt: TimestampSchema.optional(),
  provenance: z.array(z.string()).default([]),
  createdAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ClaimSchema = z.object({
  id: IdSchema,
  statement: z.string(),
  type: z.string().default('fact'),
  confidence: ConfidenceSchema.optional(),
  evidenceIds: z.array(IdSchema).default([]),
  status: z.enum(['unverified', 'supported', 'refuted', 'insufficient']),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type Claim = z.infer<typeof ClaimSchema>;

export const EvidenceChainSchema = z.object({
  claimId: IdSchema,
  evidenceIds: z.array(IdSchema),
  sources: z.array(SourceSchema),
  verifiedAt: TimestampSchema,
  summary: z.string().optional(),
});
export type EvidenceChain = z.infer<typeof EvidenceChainSchema>;