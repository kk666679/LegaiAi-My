/**
 * Common shared primitives used across all LAWMATE contracts.
 */
import { z } from 'zod';

// --- Identifiers -----------------------------------------------------------

/** Stable identifier scheme. Display names must never be used as IDs. */
export const IdSchema = z.string().regex(
  /^(agent|skill|tool|dataset|evidence|eval|workflow|memory|kg|adapter|provider|policy|learning|comms|registry):\/\/lawmate\/[a-z0-9][a-z0-9._-]*/i,
  'Invalid identifier: must be scheme://lawmate/<slug>'
);
export type Id = z.infer<typeof IdSchema>;

export const VersionSchema = z.string().regex(
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[\w.]+)?(?:\+[\w.]+)?$/,
  'Invalid semver'
);
export type Version = z.infer<typeof VersionSchema>;

// --- Actor / tenant --------------------------------------------------------

export const ActorSchema = z.object({
  id: z.string(),
  type: z.enum(['user', 'agent', 'system', 'service']),
  name: z.string().optional(),
});
export type Actor = z.infer<typeof ActorSchema>;

export const TenantContextSchema = z.object({
  tenantId: z.string().optional(),
  projectId: z.string().optional(),
  actorId: z.string().optional(),
  actorType: ActorSchema.shape.type.optional(),
});
export type TenantContext = z.infer<typeof TenantContextSchema>;

// --- Timestamps / metadata -------------------------------------------------

export const TimestampSchema = z.string().datetime();
export type Timestamp = z.infer<typeof TimestampSchema>;

export const MetadataSchema = z.record(z.string(), z.unknown());
export type Metadata = z.infer<typeof MetadataSchema>;

// --- Error model -----------------------------------------------------------

export const ErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'AUTHORIZATION_ERROR',
  'POLICY_DENIED',
  'NOT_FOUND',
  'CONFLICT',
  'TIMEOUT',
  'PROVIDER_ERROR',
  'EXECUTION_ERROR',
  'EVIDENCE_ERROR',
  'EVALUATION_ERROR',
  'REGISTRY_ERROR',
  'MEMORY_ERROR',
  'DATASET_ERROR',
  'LEARNING_ERROR',
  'COMMS_ERROR',
  'ADAPTER_ERROR',
  'BUILD_ERROR',
  'INTERNAL_ERROR',
]);
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;

export const LawmateErrorSchema = z.object({
  code: ErrorCodeSchema,
  message: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
  cause: z.string().optional(),
  timestamp: TimestampSchema,
  requestId: z.string().optional(),
});
export type LawmateError = z.infer<typeof LawmateErrorSchema>;

// --- Decision model --------------------------------------------------------

export const DecisionSchema = z.enum(['ALLOW', 'DENY', 'REQUIRE_APPROVAL', 'REDACT', 'ESCALATE']);
export type Decision = z.infer<typeof DecisionSchema>;

// --- Capability / permission -----------------------------------------------

export const CapabilitySchema = z.string();
export type Capability = z.infer<typeof CapabilitySchema>;

// --- Risk classification ---------------------------------------------------

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);
export type RiskLevel = z.infer<typeof RiskLevelSchema>;

// --- HITL ------------------------------------------------------------------

export const HitlLevelSchema = z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
export type HitlLevel = z.infer<typeof HitlLevelSchema>;

export const HITL_LABELS: Record<HitlLevel, string> = {
  0: 'Read',
  1: 'Recommend',
  2: 'Draft',
  3: 'Execute + Approval',
  4: 'Controlled Auto',
  5: 'Prohibited',
};

// --- Data classification ---------------------------------------------------

export const DataClassSchema = z.enum(['public', 'internal', 'confidential', 'privileged']);
export type DataClass = z.infer<typeof DataClassSchema>;

// --- Status ----------------------------------------------------------------

export const RegistryStatusSchema = z.enum(['active', 'deprecated', 'disabled', 'revoked']);
export type RegistryStatus = z.infer<typeof RegistryStatusSchema>;

// --- Retention -------------------------------------------------------------

export const RetentionPolicySchema = z.object({
  ttlSeconds: z.number().int().positive().optional(),
  maxAgeSeconds: z.number().int().positive().optional(),
  autoDelete: z.boolean().default(false),
  redactSensitive: z.boolean().default(true),
});
export type RetentionPolicy = z.infer<typeof RetentionPolicySchema>;

// --- Pagination ------------------------------------------------------------

export const PaginationSchema = z.object({
  limit: z.number().int().positive().default(50),
  cursor: z.string().optional(),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export const PageSchema = z.object({
  items: z.array(z.any()),
  nextCursor: z.string().optional(),
  total: z.number().int().nonnegative().optional(),
});
export type Page<T> = { items: T[]; nextCursor?: string; total?: number };

// --- Environment -----------------------------------------------------------

export const EnvSchema = z.enum(['development', 'staging', 'production']);
export type Env = z.infer<typeof EnvSchema>;

// --- Generic result --------------------------------------------------------

export const ResultSchema = z.object({
  success: z.boolean(),
  error: LawmateErrorSchema.optional(),
});
export type Result = z.infer<typeof ResultSchema>;
export const ConfidenceSchema = z.number().min(0).max(1);
export type Confidence = z.infer<typeof ConfidenceSchema>;
