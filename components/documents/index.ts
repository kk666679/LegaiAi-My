export { DocumentsNav, getDocumentsNavItems } from "./DocumentsNav";
export { DocumentsShell } from "./DocumentsShell";
export { DocumentCollections } from "./DocumentCollections";
export { DocumentWorkspace } from "./DocumentWorkspace";
export {
  DocumentAIPanel,
  DocumentAIContext,
  type DocumentAIMessage,
} from "./DocumentAIPanel";
  CONTRACT_SUGGESTIONS,
  DOCUMENT_SUGGESTIONS,
} from "./suggestions";
// components/documents/index.ts
export * from "./types";

// core
export { DocumentsShell } from "./core/documents-shell";
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
export { DocumentWorkspace } from "./workspace/document-workspace";

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
