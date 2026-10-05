/**
 * Shared Documents domain types (§39).
 *
 * There is exactly ONE document model in this application: the Prisma
 * `legal_documents` row, surfaced through the `documents` tRPC router and typed
 * in `@/types/documents` / `@/hooks/useDocuments`. This module does **not**
 * introduce a competing model — it re-exports the real types and adds only the
 * presentation-layer vocabulary the Documents domain needs:
 *
 *   • `DocumentLifecycleStatus` — the full lifecycle, including transient
 *     pipeline phases (uploading, processing, analysing…) that are NOT
 *     persisted. `toPersistedStatus()` is the single bridge back to the
 *     database enum, so the UI can never invent a status the backend rejects.
 *   • analysis / evidence / version / activity / permission shapes that the
 *     domain components accept as props.
 *
 * Nothing here fabricates data. Fields the backend does not store are optional
 * and stay absent until a real endpoint supplies them (AGENTS.md safety rule 1:
 * never fabricate).
 */

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  FileSignature,
  FileText,
  Gavel,
  Mail,
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
  | "analysed"
  | "commented"
  | "shared"
  | "reviewed"
  | "approved"
  | "exported"
  | "archived";

export interface DocumentActivityEntry {
  id: string;
  kind: DocumentActivityKind;
  actor?: string;
  /** ISO timestamp. */
  at: string;
  detail?: string;
}

export interface DocumentComment {
  id: string;
  author: string;
  body: string;
  at: string;
  /** Anchor inside the document (page/clause) when the backend records one. */
  locator?: string;
  resolved?: boolean;
  replies?: DocumentComment[];
}

/* ── Permissions & sharing ─────────────────────────────────────────────── */

export type DocumentShareRole = "owner" | "editor" | "reviewer" | "viewer";

export const DOCUMENT_SHARE_ROLE_LABELS: Record<DocumentShareRole, string> = {
  owner: "Owner",
  editor: "Editor",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

export interface DocumentPermissionEntry {
  id: string;
  /** Display name of the user or team. */
  name: string;
  role: DocumentShareRole;
  avatarUrl?: string;
}

/** The capability set the UI gates on. */
export interface DocumentCapabilities {
  canView: boolean;
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canExport: boolean;
  canDelete: boolean;
  canApprove: boolean;
}

/* ── Collections / folders / tags ──────────────────────────────────────── */

export type DocumentCollectionId =
  | "all"
  | "recent"
  | "favorites"
  | "shared"
  | "archived"
  | "contracts"
  | "drafts"
  | "templates";

export interface DocumentCollection {
  id: DocumentCollectionId;
  label: string;
  icon: LucideIcon;
  description: string;
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  documentCount?: number;
}

/* ── Grouping helpers ──────────────────────────────────────────────────── */

export interface DocumentGroup<T = DocumentListItem> {
  key: string;
  label: string;
  items: T[];
}

export interface DocumentLibraryStats {
  total: number;
  stats: DocumentStats | null;
  clientNames: Map<string, string>;
  clients: { id: string; name: string }[];
}

/** Convenience alias so pages don't re-import the Prisma model. */
export type DocumentRecord = DocumentListItem & {
  fileSize?: number;
  pageCount?: number;
  parties?: DocumentParties | null;
  jurisdiction?: string | null;
};
  locator?: string;
  evidenceIds?: string[];
}

export interface AnalysisObligation {
  id: string;
  description: string;
  /** ISO date when known. */
  dueOn?: string;
  party?: string;
}

export interface AnalysisDate {
  id: string;
  label: string;
  /** ISO date. */
  value: string;
  kind?: "effective" | "expiry" | "notice" | "filing" | "other";
}

export interface AnalysisParty {
  id: string;
  role: string;
  name: string;
}
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