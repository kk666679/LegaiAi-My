// components/documents/types.ts
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Archive,
  BookOpen,
  FileSignature,
  FileText,
  Gavel,
  Mail,
  Star,
  Users,
} from "lucide-react";
import {
  DOC_COURTS,
  DOC_STATUSES,
  DOC_TYPES,
  type DocumentCourt,
  type DocumentFilters as PersistedDocumentFilters,
  type DocumentListItem,
  type DocumentStats,
  type DocumentStatus as PersistedDocumentStatus,
  type DocumentType,
} from "@/hooks/useDocuments";

export type {
  ClientSummary,
  DocumentCourt,
  DocumentListItem,
  DocumentStats,
  DocumentStatus as PersistedDocumentStatus,
  DocumentType,
} from "@/hooks/useDocuments";
export type {
  DocStatus,
  DocType,
  CourtLevel,
  DocumentParties,
} from "@/types/documents";
export { DOC_COURTS, DOC_STATUSES, DOC_TYPES };

export const DOCUMENT_LIFECYCLE_STATUSES = [
  "draft",
  "uploading",
  "processing",
  "ready",
  "analysing",
  "analysed",
  "review",
  "changes-requested",
  "approved",
  "final",
  "archived",
  "error",
] as const;

export type DocumentLifecycleStatus =
  (typeof DOCUMENT_LIFECYCLE_STATUSES)[number];

export type DocumentStatus = DocumentLifecycleStatus;

export const PERSISTED_STATUSES: readonly PersistedDocumentStatus[] = [
  "draft",
  "review",
  "approved",
  "archived",
];

export const TRANSIENT_STATUSES: readonly DocumentLifecycleStatus[] = [
  "uploading",
  "processing",
  "analysing",
  "error",
];

export function toPersistedStatus(
  status: DocumentLifecycleStatus,
): PersistedDocumentStatus | null {
  switch (status) {
    case "draft":
    case "ready":
    case "analysed":
      return "draft";
    case "review":
    case "changes-requested":
      return "review";
    case "approved":
    case "final":
      return "approved";
    case "archived":
      return "archived";
    case "uploading":
    case "processing":
    case "analysing":
    case "error":
      return null;
  }
}

export function isBusyStatus(status: DocumentLifecycleStatus): boolean {
  return TRANSIENT_STATUSES.includes(status);
}

export const DOCUMENT_LIFECYCLE_LABELS: Record<DocumentLifecycleStatus, string> = {
  draft: "Draft",
  uploading: "Uploading",
  processing: "Processing",
  ready: "Ready",
  analysing: "Analysing",
  analysed: "Analysed",
  review: "In review",
  "changes-requested": "Changes requested",
  approved: "Approved",
  final: "Final",
  archived: "Archived",
  error: "Error",
};

export function statusToneKey(status: DocumentLifecycleStatus): string {
  switch (status) {
    case "approved":
    case "final":
    case "ready":
    case "analysed":
      return "approved";
    case "review":
    case "changes-requested":
    case "processing":
    case "uploading":
    case "analysing":
      return "review";
    case "error":
      return "critical";
    case "archived":
      return "archived";
    default:
      return "draft";
  }
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = Object.fromEntries(
  DOC_TYPES.map((type) => [type.value, type.label]),
) as Record<DocumentType, string>;

export const DOCUMENT_COURT_LABELS: Record<DocumentCourt, string> = Object.fromEntries(
  DOC_COURTS.map((court) => [court.value, court.label]),
) as Record<DocumentCourt, string>;

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, LucideIcon> = {
  CONTRACT: FileSignature,
  AGREEMENT: FileSignature,
  PLEADING: Gavel,
  MOTION: Gavel,
  BRIEF: BookOpen,
  MEMORANDUM: FileText,
  LETTER: Mail,
  OTHER: FileText,
};

export function documentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type as DocumentType] ?? type;
}

export function documentCourtLabel(court: string): string {
  return DOCUMENT_COURT_LABELS[court as DocumentCourt] ?? court;
}

export const DOCUMENT_COLLECTIONS = [
  {
    id: "all",
    label: "All documents",
    icon: FileText,
    description: "Every document you can access",
  },
  {
    id: "recent",
    label: "Recent",
    icon: BookOpen,
    description: "Recently updated documents",
  },
  {
    id: "favorites",
    label: "Favorites",
    icon: Star,
    description: "Documents you starred",
  },
  {
    id: "shared",
    label: "Shared",
    icon: Users,
    description: "Documents shared with your team",
  },
  {
    id: "contracts",
    label: "Contracts",
    icon: FileSignature,
    description: "Contracts and agreements",
  },
  {
    id: "drafts",
    label: "Drafts",
    icon: FileSignature,
    description: "Documents still in draft",
  },
  {
    id: "templates",
    label: "Templates",
    icon: FileSignature,
    description: "Reusable document templates",
  },
  {
    id: "archived",
    label: "Archived",
    icon: Archive,
    description: "Archived documents",
  },
] as const;

export type DocumentCollectionId = (typeof DOCUMENT_COLLECTIONS)[number]["id"];

export function documentLifecycleLabel(
  status: DocumentLifecycleStatus,
): string {
  return DOCUMENT_LIFECYCLE_LABELS[status];
}

export const DOCUMENT_VIEWS = ["list", "grid", "table"] as const;
export type DocumentView = (typeof DOCUMENT_VIEWS)[number];
export type DocumentViewMode = DocumentView;

export const DOCUMENT_VIEW_LABELS: Record<DocumentView, string> = {
  list: "List",
  grid: "Grid",
  table: "Table",
};

export const DOCUMENT_SORT_OPTIONS = [
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "updatedAt:asc", label: "Least recently updated" },
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "title:asc", label: "Name (A–Z)" },
  { value: "title:desc", label: "Name (Z–A)" },
] as const;

export type DocumentSortValue = (typeof DOCUMENT_SORT_OPTIONS)[number]["value"];
export type DocumentSortKey =
  | "updatedAt"
  | "createdAt"
  | "name"
  | "type"
  | "status";
export type SortDirection = "asc" | "desc";

export interface DocumentFilters {
  query?: string;
  type?: string[];
  status?: DocumentStatus[];
  category?: string[];
  ownerId?: string[];
  folderId?: string | null;
  tagIds?: string[];
  aiStatus?: Array<NonNullable<LegalDocument["aiStatus"]>>;
  dateFrom?: string;
  dateTo?: string;
}

export interface DocumentSort {
  key: DocumentSortKey;
  direction: SortDirection;
}

export function parseSort(
  value: string,
): Pick<PersistedDocumentFilters, "sortBy" | "sortOrder"> {
  const [sortBy, sortOrder] = value.split(":") as [
    PersistedDocumentFilters["sortBy"],
    PersistedDocumentFilters["sortOrder"],
  ];
  return { sortBy, sortOrder };
}

export function formatSort(
  filters: Pick<PersistedDocumentFilters, "sortBy" | "sortOrder">,
): DocumentSortValue {
  return `${filters.sortBy}:${filters.sortOrder}` as DocumentSortValue;
}

export type DocumentAnalysisState =
  | "not-started"
  | "running"
  | "complete"
  | "failed";

export interface DocumentAnalysisSummary {
  state: DocumentAnalysisState;
  completedAt?: string;
  confidence?: number;
  errorMessage?: string;
}

export type AnalysisSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface AnalysisFinding {
  id: string;
  title: string;
  detail?: string;
  severity: AnalysisSeverity;
  kind?: string;
  locator?: string;
  evidenceIds?: string[];
}

export type EvidenceVerificationStatus =
  | "verified"
  | "unverified"
  | "insufficient";

export interface DocumentEvidenceItem {
  id: string;
  title: string;
  url?: string;
  court?: string;
  jurisdiction?: string;
  citation?: string;
  date?: string;
  excerpt?: string;
  verificationStatus: EvidenceVerificationStatus;
  confidence?: number;
  locator?: string;
}

export interface DocumentCitation {
  id: string;
  label: string;
  source: string;
  href?: string;
  verified?: boolean;
}

export interface DocumentVersion {
  id: string;
  documentId?: string;
  version?: number;
  label?: string;
  versionNumber?: number;
  createdAt: string;
  createdBy?: string;
  authorId?: string;
  authorName?: string;
  note?: string;
  summary?: string;
  size?: number;
  isCurrent?: boolean;
  content?: string;
}

export type DocumentActivityKind =
  | "created"
  | "uploaded"
  | "viewed"
  | "edited"
  | "analysed"
  | "commented"
  | "shared"
  | "reviewed"
  | "approved"
  | "rejected"
  | "exported"
  | "archived"
  | "restored";

export type DocumentPermission =
  | "view"
  | "edit"
  | "comment"
  | "share"
  | "export"
  | "delete"
  | "approve";

export type DocumentRole = "owner" | "editor" | "reviewer" | "viewer";
export type DocumentShareRole = DocumentRole;

export interface DocumentParty {
  id: string;
  name: string;
  role?: string;
  kind?: "individual" | "company" | "government" | "other";
}

export interface DocumentTag {
  id: string;
  label: string;
  color?: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string | null;
  count?: number;
  system?: boolean;
  children?: DocumentFolder[];
}

export interface LegalDocument {
  id: string;
  name: string;
  type: string;
  category?: string;
  status: DocumentStatus;
  ownerId?: string;
  ownerName?: string;
  folderId?: string | null;
  size?: number;
  pageCount?: number;
  language?: string;
  jurisdiction?: string | null;
  parties?: DocumentParty[] | null;
  tags?: DocumentTag[];
  favorite?: boolean;
  aiStatus?: "idle" | "queued" | "running" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  url?: string;
}

export interface DocumentActivityEvent {
  id: string;
  documentId: string;
  kind: DocumentActivityKind;
  actorId?: string;
  actorName?: string;
  timestamp: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl?: string;
  body: string;
  createdAt: string;
  resolved?: boolean;
  anchor?: {
    page?: number;
    x?: number;
    y?: number;
    excerpt?: string;
  };
}

export interface DocumentPermissionEntry {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: DocumentRole;
}

export interface DocumentAnalysisFinding {
  id: string;
  kind: "risk" | "obligation" | "date" | "clause" | "party" | "compliance";
  title: string;
  summary?: string;
  severity?: "low" | "medium" | "high" | "critical";
  confidence?: number;
  evidenceIds?: string[];
}

export interface DocumentEvidence {
  id: string;
  documentId: string;
  page?: number;
  section?: string;
  excerpt: string;
  relevance?: string;
  confidence?: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  category?: string;
  description?: string;
  jurisdiction?: string;
  tags?: string[];
  favorite?: boolean;
  previewUrl?: string;
}

export interface DocumentsStats {
  total: number;
  ready: number;
  processing: number;
  review: number;
  pendingApproval: number;
  analysed: number;
  favorites: number;
}

export interface DocumentsCapabilities {
  canCreate: boolean;
  canUpload: boolean;
  canAnalyse: boolean;
  canShare: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export interface DocumentCapabilities {
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canExport: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

export interface DocumentActionContext {
  document: LegalDocument;
  permissions: DocumentPermission[];
}

export type { ReactNode };
