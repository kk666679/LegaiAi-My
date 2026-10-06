export { DocumentsNav, getDocumentsNavItems } from "./DocumentsNav";
export { DocumentsShell } from "./DocumentsShell";
export { DocumentCollections } from "./DocumentCollections";
export { DocumentsHub } from "./DocumentsHub";
export { DocumentWorkspace } from "./DocumentWorkspace";
export {
  DocumentAIPanel,
  DocumentAIContext,
  type DocumentAIMessage,
} from "./DocumentAIPanel";
export {
  CONTRACT_SUGGESTIONS,
  DOCUMENT_SUGGESTIONS,
} from "./suggestions";
export * from "./types";

// core
export { DocumentsShell as LegacyDocumentsShell } from "./core/documents-shell";
export { DocumentsHeader } from "./core/documents-header";
export { DocumentsNavigation } from "./core/documents-navigation";
export { DocumentsToolbar } from "./core/documents-toolbar";
export { DocumentsBreadcrumbs } from "./core/documents-breadcrumbs";
export { DocumentsProvider, useDocuments } from "./core/documents-context";

// overview
export { DocumentsOverview } from "./overview/documents-overview";
export { DocumentsSummary } from "./overview/documents-summary";
export { DocumentsQuickActions } from "./overview/documents-quick-actions";
export { RecentDocuments } from "./overview/recent-documents";
export { DocumentActivityOverview } from "./overview/document-activity";

// library
export { DocumentLibrary } from "./library/document-library";
export { DocumentCard } from "./library/document-card";
export { DocumentRow } from "./library/document-row";
export { DocumentGrid } from "./library/document-grid";
export { DocumentList } from "./library/document-list";
export { DocumentTable } from "./library/document-table";
export { DocumentPagination } from "./library/document-pagination";

// search
export { DocumentSearch } from "./search/document-search";
export { DocumentSearchBar } from "./search/document-search-bar";
export { DocumentFilterBar } from "./search/document-filter-bar";
export { DocumentFilterChips } from "./search/document-filter-chips";
export { DocumentSortSelect } from "./search/document-sort";

// upload
export { DocumentDropzone } from "./upload/document-dropzone";
export { DocumentUploadDialog } from "./upload/document-upload-dialog";
export { UploadQueue } from "./upload/upload-queue";

// preview
export { DocumentPreview } from "./preview/document-preview";
export { DocumentViewer } from "./preview/document-viewer";
export { DocumentToolbar as DocumentPreviewToolbar } from "./preview/document-toolbar";

// metadata
export { DocumentMetadata } from "./metadata/document-metadata";
export { DocumentTags } from "./metadata/document-tags";
export { DocumentStatus } from "./metadata/document-status";

// actions
export { DocumentActionMenu } from "./actions/document-action-menu";

// organization
export { FavoriteToggle } from "./organization/favorite-toggle";

// workspace
export { DocumentWorkspace as LegacyDocumentWorkspace } from "./workspace/document-workspace";

// ai
export { DocumentAIWorkspace } from "./ai/document-ai-workspace";
export { DocumentAIActions } from "./ai/document-ai-actions";

// analysis
export { DocumentAnalysis } from "./analysis/document-analysis";
export { AnalysisSummary } from "./analysis/analysis-summary";
export { AnalysisFindings } from "./analysis/analysis-findings";

// evidence
export { EvidenceList } from "./evidence/evidence-list";

// versions
export { VersionList } from "./versions/version-list";

// comparison
export { ComparisonWorkspace } from "./comparison/comparison-workspace";

// permissions
export { PermissionEditor } from "./permissions/permission-editor";
export { ShareDocument } from "./permissions/share-document";

// templates
export { TemplateCard } from "./templates/template-card";

// contracts
export { ContractsWorkspace } from "./contracts/contracts-workspace";
export { ContractCard } from "./contracts/contract-card";

// activity
export { DocumentActivityFeed } from "./activity/document-activity-feed";
export { ActivityItem } from "./activity/activity-item";

// status
export { DocumentStatusIndicator } from "./status/document-status-indicator";
export { DocumentEmpty } from "./status/document-empty";
export { DocumentLoading } from "./status/document-loading";
export { DocumentError } from "./status/document-error";
export { DocumentProcessing } from "./status/document-processing";
export { DocumentNotFound } from "./status/document-not-found";

// studio
export { DraftingStudio } from "./studio/drafting-studio";

// ─── creation ─────────────────────────────────────────────
export { DocumentTypeSelector } from "./creation/document-type-selector";
export { DocumentTemplateSelector } from "./creation/document-template-selector";
export { DocumentCreationForm, type DocumentCreationFormValues } from "./creation/document-creation-form";
export { DocumentCreationPreview } from "./creation/document-creation-preview";
export { NewDocumentDialog } from "./creation/new-document-dialog";
export { CreateDocument } from "./creation/create-document";

// ─── preview extensions ───────────────────────────────────
export { DocumentPageControls } from "./preview/document-page-controls";
export { DocumentZoomControls } from "./preview/document-zoom-controls";
export { DocumentThumbnailSidebar } from "./preview/document-thumbnail-sidebar";
export { DocumentFullscreen } from "./preview/document-fullscreen";

// ─── metadata extensions ──────────────────────────────────
export { DocumentType } from "./metadata/document-type";
export { DocumentDates } from "./metadata/document-dates";
export { DocumentProperties, type DocumentProperty } from "./metadata/document-properties";
export { DocumentInfo } from "./metadata/document-info";

// ─── actions extensions ───────────────────────────────────
export { DocumentDownload } from "./actions/document-download";
export { DocumentExport, type ExportFormat } from "./actions/document-export";
export { DocumentShare } from "./actions/document-share";
export { DocumentDuplicate } from "./actions/document-duplicate";
export { DocumentRename } from "./actions/document-rename";
export { DocumentArchive } from "./actions/document-archive";
export { DocumentDelete } from "./actions/document-delete";
export { DocumentMove } from "./actions/document-move";
export { DocumentActions } from "./actions/document-actions";

// ─── organization extensions ──────────────────────────────
export { FolderTree } from "./organization/folder-tree";
export { FolderSelector } from "./organization/folder-selector";
export { FolderDialog } from "./organization/folder-dialog";
export { DocumentTagsEditor } from "./organization/document-tags-editor";
export { type DocumentCollection } from "./organization/document-collections";

// ─── workspace extensions ─────────────────────────────────
export { DocumentWorkspaceHeader } from "./workspace/document-workspace-header";
export { DocumentWorkspaceTabs, type WorkspaceTab } from "./workspace/document-workspace-tabs";
export { DocumentContextPanel } from "./workspace/document-context-panel";
export { DocumentSidebar } from "./workspace/document-sidebar";
export { DocumentWorkspaceLayout } from "./workspace/document-workspace-layout";

// ─── ai extensions ────────────────────────────────────────
export { DocumentAIAssistant } from "./ai/document-ai-assistant";
export { DocumentAISuggestions } from "./ai/document-ai-suggestions";
export { DocumentAIContext as DocumentAIContextCard } from "./ai/document-ai-context";
export { DocumentAIHistory } from "./ai/document-ai-history";

// ─── analysis extensions ──────────────────────────────────
export { AnalysisWorkspace } from "./analysis/analysis-workspace";
export { AnalysisRisks } from "./analysis/analysis-risks";
export { AnalysisObligations } from "./analysis/analysis-obligations";
export { AnalysisDates } from "./analysis/analysis-dates";
export { AnalysisClauses } from "./analysis/analysis-clauses";
export { AnalysisParties } from "./analysis/analysis-parties";
export { AnalysisConfidence } from "./analysis/analysis-confidence";
export { AnalysisEvidence } from "./analysis/analysis-evidence";
export { ProvenanceStrip } from "./analysis/provenance-strip";
export { ScoreBar } from "./analysis/score-bar";
export {
  toDocumentAnalysisFinding,
  toDocumentAnalysisFindings,
} from "./analysis/adapters";

// ─── evidence extensions ──────────────────────────────────
export { EvidenceCard } from "./evidence/evidence-card";
export { EvidenceViewer } from "./evidence/evidence-viewer";
export { DocumentEvidenceView } from "./evidence/document-evidence";
export { CitationReference } from "./evidence/citation-reference";
export { CitationList } from "./evidence/citation-list";

// ─── drafting ─────────────────────────────────────────────
export { DraftingSteps, type DraftingStep } from "./drafting/drafting-steps";
export { DraftingForm, type DraftingFormValues } from "./drafting/drafting-form";
export { DraftingPreview } from "./drafting/drafting-preview";
export { DraftingToolbar } from "./drafting/drafting-toolbar";
export { DraftingActions } from "./drafting/drafting-actions";
export { DraftingWorkspace } from "./drafting/drafting-workspace";
export { DocumentDrafting } from "./drafting/document-drafting";

// ─── studio extensions ────────────────────────────────────
export { StudioLayout } from "./studio/studio-layout";
export type { OutlineSection } from "./studio/studio-outline";
export type { StudioAIMessage } from "./studio/studio-ai-panel";
export type { StudioTemplate } from "./studio/studio-toolbar";
export { StudioSuggestions } from "./studio/studio-suggestions";
export { StudioInsights } from "./studio/studio-insights";

// ─── contracts extensions ─────────────────────────────────
export { ContractStatus } from "./contracts/contract-status";
export { ContractList } from "./contracts/contract-list";
export { ContractTable } from "./contracts/contract-table";
export { ContractFilters } from "./contracts/contract-filters";
export { ContractSummary } from "./contracts/contract-summary";
export { ContractParties } from "./contracts/contract-parties";
export { ContractDates } from "./contracts/contract-dates";
export { ContractObligations, type Obligation } from "./contracts/contract-obligations";
export { ContractInsights, type ContractInsight } from "./contracts/contract-insights";
export { ContractDetail } from "./contracts/contract-detail";

// ─── comparison extensions ────────────────────────────────
export { ComparisonHeader } from "./comparison/comparison-header";
export { ComparisonPane } from "./comparison/comparison-pane";
export { ComparisonDiff, type DiffLine } from "./comparison/comparison-diff";
export { ComparisonSummary, type ComparisonStats } from "./comparison/comparison-summary";
export { DocumentComparison } from "./comparison/document-comparison";

// ─── versions extensions ──────────────────────────────────
export { VersionCard } from "./versions/version-card";
export { VersionDiff } from "./versions/version-diff";
export { VersionRestore } from "./versions/version-restore";
export { VersionHistory } from "./versions/version-history";
export { DocumentVersions } from "./versions/document-versions";

// ─── collaboration ────────────────────────────────────────
export { DocumentComment } from "./collaboration/document-comment";
export { DocumentComments } from "./collaboration/document-comments";
export { DocumentPresence } from "./collaboration/document-presence";
export { DocumentReview, type ReviewState } from "./collaboration/document-review";

// ─── permissions extensions ───────────────────────────────
export { PermissionList } from "./permissions/permission-list";
export { AccessSummary, type AccessLevel } from "./permissions/access-summary";
export { DocumentPermissions } from "./permissions/document-permissions";

// ─── templates extensions ─────────────────────────────────
export { TemplateList } from "./templates/template-list";
export { TemplatePreview } from "./templates/template-preview";
export { TemplateCategory } from "./templates/template-category";
export { TemplateSelector } from "./templates/template-selector";
export { DocumentTemplates } from "./templates/document-templates";

// ─── activity extensions ──────────────────────────────────
export { ActivityFilter } from "./activity/activity-filter";
export { ActivityTimeline } from "./activity/activity-timeline";

// ─── mobile ───────────────────────────────────────────────
export { MobileDocumentToolbar } from "./mobile/mobile-document-toolbar";
export { MobileDocumentNav } from "./mobile/mobile-document-nav";
export { MobileDocumentPanel } from "./mobile/mobile-document-panel";
export { MobileDocumentActions } from "./mobile/mobile-document-actions";

// ─── charts ───────────────────────────────────────────────
export * from "./charts";

// hooks
export { useDocumentsList, type UseDocumentsListOptions, type UseDocumentsListResult } from "./hooks/use-documents-list";
