// components/hitl/types.ts
import type { ReactNode } from "react";

export type HITLRequestKind =
  | "ai-draft-review"
  | "ai-analysis-review"
  | "document-approval"
  | "contract-approval"
  | "matter-opening"
  | "conflict-resolution"
  | "high-value-action"
  | "low-confidence-ai"
  | "regulatory-review"
  | "escalation"
  | "custom";

export type HITLPriority = "low" | "normal" | "high" | "urgent";

export type HITLStatus =
  | "pending"
  | "in-review"
  | "escalated"
  | "changes-requested"
  | "approved"
  | "rejected"
  | "deferred"
  | "expired"
  | "cancelled";

export type HITLDecisionKind =
  | "approve"
  | "reject"
  | "request-changes"
  | "escalate"
  | "defer";

export type HITLSourceDomain =
  | "documents"
  | "matters"
  | "contracts"
  | "automation"
  | "ai"
  | "custom";

export interface HITLActor {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role?: string;
}

export interface HITLThreshold {
  field: string;
  value: string;
  comparator: ">" | ">=" | "<" | "<=" | "==" | "!=";
  actual?: string;
  breached: boolean;
}

export interface HITLArtifact {
  id: string;
  kind:
    | "document"
    | "clause"
    | "draft"
    | "analysis"
    | "invoice"
    | "matter"
    | "contract"
    | "note"
    | "json"
    | "text";
  label: string;
  preview?: string;
  href?: string;
  domain?: HITLSourceDomain;
  domainId?: string;
  metadata?: Record<string, unknown>;
}

export interface HITLSource {
  domain: HITLSourceDomain;
  resourceId?: string;
  resourceName?: string;
  action?: string;
  aiModel?: string;
  aiConfidence?: number;
  reasoningSummary?: string;
}

export interface HITLSLADetail {
  hoursAllowed: number;
  startedAt: string;
  dueAt: string;
  breached: boolean;
  breachedAt?: string;
  remainingMinutes?: number;
}

export interface HITLDecision {
  id: string;
  kind: HITLDecisionKind;
  actorId: string;
  actorName: string;
  decidedAt: string;
  comments?: string;
  corrections?: Array<{ id: string; before: string; after: string; reason?: string }>;
  targetAssigneeId?: string;
  targetAssigneeName?: string;
  confidence?: number;
}

export interface HITLComment {
  id: string;
  actorId: string;
  actorName: string;
  actorAvatarUrl?: string;
  body: string;
  createdAt: string;
  internal?: boolean;
}

export type HITLActivityKind =
  | "created"
  | "assigned"
  | "reassigned"
  | "claimed"
  | "commented"
  | "escalated"
  | "de-escalated"
  | "approved"
  | "rejected"
  | "changes-requested"
  | "deferred"
  | "expired"
  | "cancelled"
  | "feedback-submitted"
  | "audit";

export interface HITLActivityEvent {
  id: string;
  kind: HITLActivityKind;
  actorId?: string;
  actorName?: string;
  timestamp: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface HITLFeedback {
  id: string;
  requestId: string;
  actorId: string;
  actorName: string;
  submittedAt: string;
  score: 1 | 2 | 3 | 4 | 5;
  category?: "accuracy" | "completeness" | "tone" | "compliance" | "usefulness" | "other";
  notes?: string;
  correctedOutput?: string;
  usedForTraining?: boolean;
}

export interface HITLRequest {
  id: string;
  title: string;
  description?: string;
  kind: HITLRequestKind;
  status: HITLStatus;
  priority: HITLPriority;
  createdAt: string;
  updatedAt: string;
  createdBy?: HITLActor;
  assignedTo?: HITLActor;
  assigneeTeam?: string;
  claimedBy?: HITLActor;
  claimedAt?: string;
  sla?: HITLSLADetail;
  thresholds?: HITLThreshold[];
  artifacts?: HITLArtifact[];
  source?: HITLSource;
  decision?: HITLDecision;
  comments?: HITLComment[];
  activity?: HITLActivityEvent[];
  feedback?: HITLFeedback;
  tags?: string[];
  escalationLevel?: number;
  requiredApprovals?: number;
  currentApprovals?: number;
}

export interface HITLStats {
  total: number;
  pending: number;
  inReview: number;
  escalated: number;
  breachedSLAs: number;
  approvedToday: number;
  rejectedToday: number;
  avgDecisionMinutes: number;
  autoApprovalRate: number;
}

export interface HITLFilters {
  query?: string;
  status?: HITLStatus[];
  kind?: HITLRequestKind[];
  priority?: HITLPriority[];
  assigneeId?: string[];
  team?: string[];
  domain?: HITLSourceDomain[];
  breachedSLA?: boolean;
  createdFrom?: string;
  createdTo?: string;
}

export type HITLSortKey = "createdAt" | "priority" | "dueAt" | "status" | "kind";
export type HITLSortDirection = "asc" | "desc";
export interface HITLSort {
  key: HITLSortKey;
  direction: HITLSortDirection;
}

export type HITLViewMode = "list" | "grid" | "kanban";

export interface HITLRoutingRule {
  id: string;
  name: string;
  description?: string;
  when: {
    kind?: HITLRequestKind[];
    priority?: HITLPriority[];
    domain?: HITLSourceDomain[];
    threshold?: { field: string; comparator: HITLThreshold["comparator"]; value: number };
    aiConfidenceBelow?: number;
  };
  assignToTeam?: string;
  assignToUserId?: string;
  escalateToTeam?: string;
  slaHours?: number;
  requiresApprovals?: number;
  priority?: HITLPriority;
  enabled: boolean;
}

export interface HITLCapabilities {
  canClaim: boolean;
  canDecide: boolean;
  canReassign: boolean;
  canEscalate: boolean;
  canProvideFeedback: boolean;
  canViewAudit: boolean;
}

export type { ReactNode };