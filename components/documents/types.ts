// components/documents/types.ts
import type { ReactNode } from "react";

<<<<<<< HEAD
import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileSignature,
  FileText,
  Gavel,
  Mail,
  Star,
  Users,
  Archive,
} from "lucide-react";

/* ── Re-exported real data-layer types ─────────────────────────────────── */

export type {
  DocumentListItem,
  DocumentStatus as PersistedDocumentStatus,
  DocumentType,
  DocumentCourt,
  DocumentFilters,
  ClientSummary,
  DocumentStats,
} from "@/hooks/useDocuments";

export type {
  LegalDocument,
  DocStatus,
  DocType,
  CourtLevel,
  DocumentParties,
} from "@/types/documents";

import {
  DOC_COURTS,
  DOC_STATUSES,
  DOC_TYPES,
  type DocumentCourt,
  type DocumentFilters,
  type DocumentListItem,
  type DocumentStats,
  type DocumentStatus as PersistedDocumentStatus,
  type DocumentType,
} from "@/hooks/useDocuments";
import type { DocumentParties } from "@/types/documents";

export { DOC_COURTS, DOC_STATUSES, DOC_TYPES };

/* ── Lifecycle status ──────────────────────────────────────────────────── */

/**
 * The complete Documents lifecycle, per §33.
 *
 * Only the four persisted values can be written to the database. The remaining
 * values are transient phases the UI observes while a real request is in
 * flight — components that set them must clear them when the backend responds,
 * and must never assert "analysed" before the server says so.
 */
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

/** Statuses the `documents` table actually accepts. */
export const PERSISTED_STATUSES: readonly PersistedDocumentStatus[] = [
  "draft",
  "review",
  "approved",
  "archived",
];

/** Phases that exist only while a request is in flight. */
export const TRANSIENT_STATUSES: readonly DocumentLifecycleStatus[] = [
  "uploading",
  "processing",
  "analysing",
  "error",
];

/**
 * Bridges a lifecycle status back to the persisted enum.
 * Returns `null` for transient phases — the caller must not persist those.
 */
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
    // Transient — nothing to write.
    case "uploading":
    case "processing":
    case "analysing":
    case "error":
      return null;
  }
}

/** True while the document is mid-pipeline (drives spinners and live regions). */
export function isBusyStatus(status: DocumentLifecycleStatus): boolean {
  return TRANSIENT_STATUSES.includes(status);
}

/* ── Human labels ──────────────────────────────────────────────────────── */

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

/** `StatusBadge` tone key — it already maps the persisted vocabulary. */
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

/* ── Type / court labels ───────────────────────────────────────────────── */

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.value, t.label]),
) as Record<DocumentType, string>;

export const DOCUMENT_COURT_LABELS: Record<DocumentCourt, string> = Object.fromEntries(
  DOC_COURTS.map((c) => [c.value, c.label]),
) as Record<DocumentCourt, string>;

/** Icon per document type so a mixed library is scannable at a glance. */
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

/* ── Collections ───────────────────────────────────────────────────────── */

/**
 * Folder-style navigation (§19). These are *views over the same library*, not
 * separate storage — each maps onto a real query the backend can answer.
 */
export const DOCUMENT_COLLECTIONS: readonly DocumentCollection[] = [
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

export function documentLifecycleLabel(
  status: DocumentLifecycleStatus,
): string {
  return DOCUMENT_LIFECYCLE_LABELS[status];
}

/* ── Presentation view ─────────────────────────────────────────────────── */

export const DOCUMENT_VIEWS = ["list", "grid", "table"] as const;
export type DocumentView = (typeof DOCUMENT_VIEWS)[number];

export const DOCUMENT_VIEW_LABELS: Record<DocumentView, string> = {
  list: "List",
  grid: "Grid",
  table: "Table",
};

/* ── Sorting ───────────────────────────────────────────────────────────── */

export const DOCUMENT_SORT_OPTIONS = [
  { value: "updatedAt:desc", label: "Recently updated" },
  { value: "updatedAt:asc", label: "Least recently updated" },
  { value: "createdAt:desc", label: "Newest first" },
  { value: "createdAt:asc", label: "Oldest first" },
  { value: "title:asc", label: "Name (A–Z)" },
  { value: "title:desc", label: "Name (Z–A)" },
] as const;

export type DocumentSortValue = (typeof DOCUMENT_SORT_OPTIONS)[number]["value"];

/** Splits the combined `"<field>:<order>"` select value back into filters. */
export function parseSort(
  value: string,
): Pick<DocumentFilters, "sortBy" | "sortOrder"> {
  const [sortBy, sortOrder] = value.split(":") as [
    DocumentFilters["sortBy"],
    DocumentFilters["sortOrder"],
  ];
  return { sortBy, sortOrder };
}

export function formatSort(filters: DocumentFilters): DocumentSortValue {
  return `${filters.sortBy}:${filters.sortOrder}` as DocumentSortValue;
}

/* ── Analysis ──────────────────────────────────────────────────────────── */

/**
 * Per-document AI analysis state. Supplied by the caller from a real analysis
 * endpoint; the Documents components never synthesise it.
 */
export type DocumentAnalysisState =
  | "not-started"
  | "running"
  | "complete"
  | "failed";

export interface DocumentAnalysisSummary {
  state: DocumentAnalysisState;
  /** ISO timestamp of the last completed run, when known. */
  completedAt?: string;
  /** 0–1. Absent means "not reported", not "zero". */
  confidence?: number;
  errorMessage?: string;
}

export type AnalysisSeverity = "critical" | "high" | "medium" | "low" | "info";

export interface AnalysisFinding {
  id: string;
  title: string;
  detail?: string;
  severity: AnalysisSeverity;
  /** e.g. "risk" | "obligation" | "clause" | "date" | "party". */
  kind?: string;
  /** Page/section locator, when the source document exposes one. */
  locator?: string;
  evidenceIds?: string[];
}

/* ── Evidence & citations ──────────────────────────────────────────────── */

export type EvidenceVerificationStatus =
  | "verified"
  | "unverified"
  | "insufficient";

/** Maps onto the shape `components/ai/legal/evidence-panel` already accepts. */
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
  /** Page or section within the owning document, when locatable. */
  locator?: string;
}

export interface DocumentCitation {
  id: string;
  label: string;
  source: string;
  href?: string;
  verified?: boolean;
}

/* ── Versions, activity, comments ──────────────────────────────────────── */

export interface DocumentVersion {
  id: string;
  version: number;
  createdAt: string;
  createdBy?: string;
  note?: string;
  isCurrent?: boolean;
  /** Text snapshot for diffing. Only present when a real snapshot exists. */
  content?: string;
}

export type DocumentActivityKind =
  | "created"
  | "uploaded"
  | "viewed"
  | "edited"
=======
export type DocumentStatus =
  | "draft"
  | "uploading"
  | "processing"
  | "ready"
  | "analysing"
>>>>>>> 9d4a0e0 (feat: add irac-engine & convert lom-client to ESM)
  | "analysed"
  | "review"
  | "changes-requested"
  | "approved"
  | "final"
  | "archived"
  | "error";

export type DocumentPermission =
  | "view"
  | "edit"
  | "comment"
  | "share"
  | "export"
  | "delete"
  | "approve";

export type DocumentRole = "owner" | "editor" | "reviewer" | "viewer";

export type DocumentViewMode = "list" | "grid" | "table";

export type DocumentSortKey =
  | "updatedAt"
  | "createdAt"
  | "name"
  | "type"
  | "status";

export type SortDirection = "asc" | "desc";

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
<<<<<<< HEAD
  parties?: DocumentParties | null;
  jurisdiction?: string | null;
};
=======
  language?: string;
  jurisdiction?: string;
  parties?: DocumentParty[];
  tags?: DocumentTag[];
  favorite?: boolean;
  aiStatus?: "idle" | "queued" | "running" | "done" | "failed";
  createdAt: string;
  updatedAt: string;
  thumbnailUrl?: string;
  url?: string;
}

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

export interface DocumentVersion {
  id: string;
  documentId: string;
  label: string;
  versionNumber: number;
  isCurrent?: boolean;
  authorId?: string;
  authorName?: string;
  createdAt: string;
  size?: number;
  summary?: string;
}

export interface DocumentActivityEvent {
  id: string;
  documentId: string;
  kind:
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
>>>>>>> 9d4a0e0 (feat: add irac-engine & convert lom-client to ESM)

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
<<<<<<< HEAD
}
=======
  category: string;
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

export interface DocumentActionContext {
  document: LegalDocument;
  permissions: DocumentPermission[];
}

export type { ReactNode };
>>>>>>> 9d4a0e0 (feat: add irac-engine & convert lom-client to ESM)
