// components/contracts/index.ts
export * from "./types";

// core
export { ContractsProvider, useContracts } from "./core/contracts-context";
export { ContractsShell } from "./core/contracts-shell";
export { ContractsHeader } from "./core/contracts-header";
export { ContractsNavigation } from "./core/contracts-navigation";
export { ContractsToolbar } from "./core/contracts-toolbar";

// status
export { ContractStatusIndicator, CONTRACT_STATUS_LABELS } from "./status/contract-status-indicator";
export { ContractEmpty } from "./status/contract-empty";
export { ContractLoading } from "./status/contract-loading";
export { ContractError } from "./status/contract-error";

// library
export { ContractCard } from "./library/contract-card";
export { ContractRow } from "./library/contract-row";
export { ContractGrid } from "./library/contract-grid";
export { ContractList } from "./library/contract-list";
export { ContractTable } from "./library/contract-table";
export { ContractLibrary } from "./library/contract-library";
export { ContractPagination } from "./library/contract-pagination";

// search
export { ContractSearch } from "./search/contract-search";
export { ContractSearchBar } from "./search/contract-search-bar";
export { ContractFiltersBar } from "./search/contract-filters";
export { ContractFilterChips } from "./search/contract-filter-chips";
export { ContractSortSelect } from "./search/contract-sort";

// overview
export { ContractsOverview } from "./overview/contracts-overview";
export { ContractsStats } from "./overview/contracts-stats";
export { ContractsQuickActions } from "./overview/contracts-quick-actions";

// workspace
export { ContractWorkspace, type ContractWorkspaceTab } from "./workspace/contract-workspace";

// detail
export { ContractOverview } from "./detail/contract-overview";
export { ContractTerms } from "./detail/contract-terms";
export { ContractDetailParties } from "./detail/contract-parties";
export { ContractDetailDates } from "./detail/contract-dates";
export { ContractDetailValues } from "./detail/contract-values";
export { ContractMilestones } from "./detail/contract-milestones";

// obligations
export { ObligationStatusIndicator } from "./obligations/obligation-status-indicator";
export { ObligationCard } from "./obligations/obligation-card";
export { ObligationsList } from "./obligations/obligations-list";
export { ObligationTimeline } from "./obligations/obligation-timeline";
export { ObligationTracker } from "./obligations/obligation-tracker";

// risks
export { RiskSeverityBadge } from "./risks/risk-severity-badge";
export { RiskCard } from "./risks/risk-card";
export { RisksList } from "./risks/risks-list";
export { RiskMatrix } from "./risks/risk-matrix";
export { RiskSummary } from "./risks/risk-summary";

// clauses
export { ClauseCard } from "./clauses/clause-card";
export { ClauseList } from "./clauses/clause-list";
export { ClauseExtraction } from "./clauses/clause-extraction";
export { ClauseLibrary } from "./clauses/clause-library";
export { ClauseComparison } from "./clauses/clause-comparison";
export { CLAUSE_CATEGORY_LABELS, CLAUSE_CATEGORIES } from "./clauses/clause-categories";

// playbook
export { PlaybookPositionCard } from "./playbook/playbook-position";
export { PlaybookRunner } from "./playbook/playbook-runner";
export { PlaybookEditor } from "./playbook/playbook-editor";
export { DEFAULT_PLAYBOOK } from "./playbook/playbook-defaults";

// negotiation
export { NegotiationTrack } from "./negotiation/negotiation-track";
export { NegotiationHistory } from "./negotiation/negotiation-history";
export { NegotiationPositions } from "./negotiation/negotiation-positions";

// renewals
export { RenewalCard } from "./renewals/renewal-card";
export { RenewalCalendar } from "./renewals/renewal-calendar";
export { RenewalAlerts } from "./renewals/renewal-alerts";

// approvals
export { ApprovalRequestCard } from "./approvals/approval-request";
export { ApprovalTracker } from "./approvals/approval-tracker";
export { ApprovalWorkflow } from "./approvals/approval-workflow";

// counterparties
export { CounterpartyCard } from "./counterparties/counterparty-card";
export { CounterpartyList } from "./counterparties/counterparty-list";
export { CounterpartyDetail } from "./counterparties/counterparty-detail";
export { CounterpartyInsights } from "./counterparties/counterparty-insights";

// ai
export { ContractAIActions } from "./ai/contract-ai-actions";
export { ContractAIWorkspace } from "./ai/contract-ai-workspace";
export { ContractSummarizer } from "./ai/contract-summarizer";
export { ContractAnalyzer } from "./ai/contract-analyzer";
export { ContractNegotiator } from "./ai/contract-negotiator";

// comparison
export { ContractDiff, type DiffLine as ContractDiffLine } from "./comparison/contract-diff";
export { ContractRedline } from "./comparison/contract-redline";
export { ContractComparison } from "./comparison/contract-comparison";

// templates
export { ContractTemplateCard } from "./templates/contract-template-card";
export { ContractTemplateLibrary } from "./templates/contract-template-library";
export { DEFAULT_CONTRACT_TEMPLATES } from "./templates/contract-template-defaults";

// analytics
export { ContractsKpis } from "./analytics/contracts-kpis";
export { ContractsChartCard } from "./analytics/contracts-charts";
export { ContractsAnalytics } from "./analytics/contracts-analytics";

// activity
export { ContractActivityFeed } from "./activity/contract-activity-feed";
export { ContractAuditLog } from "./activity/contract-audit-log";

// mobile
export { MobileContractNav } from "./mobile/mobile-contract-nav";
export { MobileContractActions } from "./mobile/mobile-contract-actions";
