// components/documents/types.ts
import type { ReactNode } from "react";

export type DocumentStatus =
  | "draft"
  | "uploading"
  | "processing"
  | "ready"
  | "analysing"
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
