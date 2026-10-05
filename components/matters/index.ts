// components/matters/index.ts
export * from "./types";

// core
export { MattersShell } from "./core/matters-shell";
export { MattersHeader } from "./core/matters-header";
export { MattersNavigation } from "./core/matters-navigation";
export { MattersToolbar } from "./core/matters-toolbar";
export { MattersBreadcrumbs } from "./core/matters-breadcrumbs";
export { MattersProvider, useMatters } from "./core/matters-context";

// status
export { MatterStatusIndicator, MATTER_STATUS_LABELS } from "./status/matter-status-indicator";
export { MatterEmpty } from "./status/matter-empty";
export { MatterLoading } from "./status/matter-loading";
export { MatterError } from "./status/matter-error";
export { MatterNotFound } from "./status/matter-not-found";

// overview
export { MattersOverview } from "./overview/matters-overview";
export { MattersSummary } from "./overview/matters-summary";
export { MattersQuickActions } from "./overview/matters-quick-actions";
export { RecentMatters } from "./overview/recent-matters";
export { UpcomingDeadlines } from "./overview/upcoming-deadlines";
export { MyTasks } from "./overview/my-tasks";

// library
export { MatterLibrary } from "./library/matter-library";
export { MatterCard } from "./library/matter-card";
export { MatterRow } from "./library/matter-row";
export { MatterGrid } from "./library/matter-grid";
export { MatterList } from "./library/matter-list";
export { MatterTable } from "./library/matter-table";
export { MatterPagination } from "./library/matter-pagination";

// search
export { MatterSearch } from "./search/matter-search";
export { MatterSearchBar } from "./search/matter-search-bar";
export { MatterFilterBar } from "./search/matter-filter-bar";
export { MatterFilterChips } from "./search/matter-filter-chips";
export { MatterSortSelect } from "./search/matter-sort";

// parties / team
export { MatterParties } from "./parties/matter-parties";
export { PartyCard } from "./parties/party-card";
export { MatterTeam } from "./team/matter-team";
export { TeamMemberCard } from "./team/team-member-card";

// tasks
export { MatterTasks } from "./tasks/matter-tasks";
export { TaskCard } from "./tasks/task-card";
export { TaskStatusIndicator } from "./tasks/task-status-indicator";

// deadlines
export { MatterDeadlines } from "./deadlines/matter-deadlines";
export { DeadlineCard } from "./deadlines/deadline-card";

// time & billing
export { MatterTime } from "./time/matter-time";
export { TimeEntry } from "./time/time-entry";
export { TimeTimer } from "./time/time-timer";
export { MatterBilling } from "./billing/matter-billing";
export { InvoiceCard } from "./billing/invoice-card";

// notes & activity
export { MatterNotes } from "./notes/matter-notes";
export { MatterActivityFeed } from "./activity/matter-activity-feed";
export { ActivityItem } from "./activity/activity-item";

// AI & analysis
export { MatterAIWorkspace } from "./ai/matter-ai-workspace";
export { MatterAIActions } from "./ai/matter-ai-actions";
export { MatterAnalysis } from "./analysis/matter-analysis";

// conflicts & permissions
export { MatterConflicts } from "./conflicts/matter-conflicts";
export { ConflictCard } from "./conflicts/conflict-card";
export { PermissionEditor } from "./permissions/permission-editor";

// documents (linked to documents domain)
export { MatterDocuments } from "./documents/matter-documents";

// workspace
export { MatterWorkspace } from "./workspace/matter-workspace";
export { MatterWorkspaceHeader } from "./workspace/matter-workspace-header";

// charts
export * from "../charts";
