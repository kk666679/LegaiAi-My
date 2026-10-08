/**
 * @components/dashboard — Legal AI workspace component system.
 *
 * Public API
 * ----------
 * All public components, types, adapters and formatters are re-exported here.
 * Consumers should import from this barrel rather than from individual files:
 *
 * ```ts
 * import {
 *   DashboardMetrics,
 *   IRACReasoningTimeline,
 *   CreditUsageDashboard,
 *   QueryResults,
 *   type DashboardMetric,
 *   type QueryResult,
 *   toSource,
 *   formatPercent,
 * } from "@/components/dashboard";
 * ```
 *
 * Internal implementation details (skeletons, error states, individual
 * indicator primitives) are **not** re-exported here — import them from their
 * source file when needed.
 */

// Types & adapters
export * from "@/components/dashboard/types";
export * from "@/components/dashboard/format";
export * from "@/components/dashboard/adapters";

// State & error handling
export {
  DashboardStateBoundary,
  DashboardSkeleton,
  MetricGridSkeleton,
  CardListSkeleton,
  PartialDataNotice,
  LiveStatus,
  toErrorMessage,
  type DashboardStateBoundaryProps,
  type DashboardError,
} from "@/components/dashboard/DashboardState";

export {
  DashboardErrorState,
  QueryErrorState,
  WorkflowErrorState,
  DocumentErrorState,
  type DashboardErrorStateProps,
} from "@/components/dashboard/DashboardErrorStates";

// Indicators
export {
  ConfidenceIndicator,
  RelevanceIndicator,
  StatusPill,
  MetricRow,
  type ConfidenceIndicatorProps,
  type RelevanceIndicatorProps,
  type StatusPillProps,
} from "@/components/dashboard/Indicators";

// Sources & citations
export {
  SourceCard,
  SourceCardSkeleton,
  type SourceCardProps,
} from "@/components/dashboard/SourceCard";

export {
  SourceList,
  SourceListSkeleton,
  CitationList,
  CitationBadge,
  SourceSummaryLine,
  indexSources,
  resolveCitationSource,
  type SourceListProps,
  type CitationListProps,
  type CitationBadgeProps,
} from "@/components/dashboard/SourceList";

// IRAC reasoning
export {
  IRACReasoningTimeline,
  IRACSkeleton,
  type IRACReasoningTimelineProps,
} from "@/components/dashboard/IRACReasoningTimeline";

// Artifacts
export {
  DocumentArtifactCard,
  type DocumentArtifactCardProps,
} from "@/components/dashboard/DocumentArtifactCard";

export {
  DocumentArtifactsResults,
  type DocumentArtifactsResultsProps,
} from "@/components/dashboard/DocumentArtifactsResults";

// Credit usage
export {
  CreditUsageDashboard,
  type CreditUsageDashboardProps,
} from "@/components/dashboard/CreditUsageDashboard";

// Activity & saved research
export {
  RecentActivityFeed,
  type RecentActivityFeedProps,
} from "@/components/dashboard/RecentActivityFeed";

export {
  SavedResearch,
  type SavedResearchProps,
} from "@/components/dashboard/SavedResearch";

// Dashboard metrics & workflow
export {
  DashboardMetrics,
  type DashboardMetricsProps,
} from "@/components/dashboard/DashboardMetrics";

export {
  AgentWorkflowExplorer,
  type AgentWorkflowExplorerProps,
} from "@/components/dashboard/AgentWorkflowExplorer";

// Query results
export {
  QueryResultsLayout,
  type QueryResultsLayoutProps,
} from "@/components/dashboard/QueryResultsLayout";

export {
  QueryResults,
  type QueryResultsProps,
} from "@/components/dashboard/QueryResults";

// Export helpers
export {
  downloadArtifact,
  toPlainText,
  toHtml,
  toFileSlug,
  artifactHeader,
} from "@/components/dashboard/export";