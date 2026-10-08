/**
 * @lawmate/types — Dataset contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, TimestampSchema, MetadataSchema } from './common';

export const DatasetSplitSchema = z.enum(['train', 'validation', 'test', 'evaluation', 'production-feedback']);
export type DatasetSplit = z.infer<typeof DatasetSplitSchema>;

export const DatasetRecordSchema = z.object({
  id: IdSchema,
  input: z.record(z.string(), z.unknown()),
  expectedOutput: z.record(z.string(), z.unknown()).optional(),
  metadata: MetadataSchema.default({}),
  source: z.string().optional(),
  provenance: z.array(z.string()).default([]),
});
export type DatasetRecord = z.infer<typeof DatasetRecordSchema>;

export const DatasetSchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(128),
  version: VersionSchema,
  description: z.string().max(2048).optional(),
  license: z.string().optional(),
  splits: z.record(DatasetSplitSchema, z.array(DatasetRecordSchema)).default({
    train: [],
    validation: [],
    test: [],
    evaluation: [],
    'production-feedback': [],
  }),
  schema: z.record(z.string(), z.unknown()).optional(),
  metadata: MetadataSchema.default({}),
  provenance: z.array(z.string()).default([]),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
});
export type Dataset = z.infer<typeof DatasetSchema>;

export const DatasetLineageSchema = z.object({
  datasetId: IdSchema,
  sourceDatasetId: IdSchema.optional(),
  transformation: z.string().optional(),
  recordCount: z.number().int().nonnegative(),
  transformations: z.array(z.object({
    name: z.string(),
    params: z.record(z.string(), z.unknown()).default({}),
    appliedAt: TimestampSchema,
  })).default([]),
});
export type DatasetLineage = z.infer<typeof DatasetLineageSchema>;

export const DatasetValidationResultSchema = z.object({
  datasetId: IdSchema,
  valid: z.boolean(),
  errors: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  recordCount: z.number().int().nonnegative(),
  validatedAt: TimestampSchema,
});
export type DatasetValidationResult = z.infer<typeof DatasetValidationResultSchema>;