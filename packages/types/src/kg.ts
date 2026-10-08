/**
 * @lawmate/types — Knowledge Graph contract.
 */
import { z } from 'zod';
import { IdSchema, VersionSchema, MetadataSchema, TimestampSchema } from './common';

export const EntitySchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(256),
  type: z.string().min(1).max(128),
  properties: z.record(z.string(), z.unknown()).default({}),
  aliases: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(1).default(1),
  provenance: z.array(z.string()).default([]),
  createdAt: TimestampSchema,
  updatedAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type Entity = z.infer<EntitySchema>;

export const RelationSchema = z.object({
  id: IdSchema,
  sourceId: IdSchema,
  targetId: IdSchema,
  type: z.string().min(1).max(128),
  properties: z.record(z.string(), z.unknown()).default({}),
  confidence: z.number().min(0).max(1).default(1),
  provenance: z.array(z.string()).default([]),
  validFrom: TimestampSchema.optional(),
  validTo: TimestampSchema.optional(),
  createdAt: TimestampSchema,
  metadata: MetadataSchema.default({}),
});
export type Relation = z.infer<RelationSchema>;

export const OntologySchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(128),
  version: VersionSchema,
  entityTypes: z.array(z.string()).default([]),
  relationTypes: z.array(z.string()).default([]),
  metadata: MetadataSchema.default({}),
});
export type Ontology = z.infer<OntologySchema>;

export const GraphQuerySchema = z.object({
  entityIds: z.array(IdSchema).optional(),
  relationTypes: z.array(z.string()).optional(),
  maxDepth: z.number().int().positive().default(3),
  limit: z.number().int().positive().default(50),
});
export type GraphQuery = z.infer<GraphQuerySchema>;

export const GraphMutationSchema = z.object({
  type: z.enum(['create-entity', 'update-entity', 'delete-entity', 'create-relation', 'delete-relation']),
  entity: EntitySchema.partial().optional(),
  relation: RelationSchema.partial().optional(),
  reason: z.string().optional(),
});
export type GraphMutation = z.infer<GraphMutationSchema>;