// components/hitl/index.ts
export * from "./types";

// core
export { HITLProvider, useHITL } from "./core/hitl-context";
export { HITLShell } from "./core/hitl-shell";
export { HITLHeader } from "./core/hitl-header";
export { HITLNavigation } from "./core/hitl-navigation";

// status
export { HITLStatusIndicator, HITL_STATUS_LABELS } from "./status/hitl-status-indicator";
export { HITLPriorityIndicator } from "./status/hitl-priority-indicator";
export { HITLSLAIndicator } from "./status/hitl-sla-indicator";
export { HITLEmpty } from "./status/hitl-empty";
export { HITLLoading } from "./status/hitl-loading";
export { HITLError } from "./status/hitl-error";

// queue
export { HITLQueueSearch } from "./queue/hitl-queue-search";
export { HITLQueueFilters } from "./queue/hitl-queue-filter";
export { HITLQueue } from "./queue/hitl-queue";

// item
export { HITLKindBadge, HITL_KIND_LABELS } from "./item/hitl-kind-badge";
export { HITLThresholdList } from "./item/hitl-threshold-list";
export { HITLArtifactList } from "./item/hitl-artifact-list";
export { HITLRequestCard } from "./item/hitl-request-card";

// review
export { HITLReviewHeader } from "./review/hitl-review-header";
export { HITLSourcePanel } from "./review/hitl-source-panel";
export { HITLCommentThread } from "./review/hitl-comment-thread";
export { HITLReviewSurface } from "./review/hitl-review-surface";

// decisions
export { HITLDecisionPanel } from "./decision/hitl-decision-panel";
export { HITLDecisionSummary } from "./decision/hitl-decision-summary";

// escalation
export { HITLEscalationBadge } from "./escalation/hitl-escalation-badge";
export { HITLEscalationRules } from "./escalation/hitl-escalation-rules";

// feedback
export { HITLFeedbackForm } from "./feedback/hitl-feedback-form";

// audit
export { HITLAuditTrail } from "./audit/hitl-audit-trail";

// notifications
export { HITLSLAAlerts } from "./notification/hitl-sla-alerts";

// analytics
export { HITLStatsCards } from "./analytics/hitl-stats-cards";
export { HITLThroughputChart } from "./analytics/hitl-throughput-chart";
export { HITLSlAComplianceChart } from "./analytics/hitl-sla-compliance-chart";

// hooks
export {
  useHITLQueue,
  type UseHITLQueueOptions,
  type UseHITLQueueResult,
} from "./hooks/use-hitl-queue";