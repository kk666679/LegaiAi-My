/**
 * Legal Document Types
 * Shared types for document CRUD operations
 */

// Document type enum
export const DOC_TYPES = [
  'CONTRACT',
  'BRIEF',
  'MOTION',
  'MEMORANDUM',
  'PLEADING',
  'AGREEMENT',
  'LETTER',
  'OTHER',
] as const

export type DocType = (typeof DOC_TYPES)[number]

// Document status enum
export const DOC_STATUSES = ['draft', 'review', 'approved', 'archived'] as const

export type DocStatus = (typeof DOC_STATUSES)[number]

// Court levels
export const COURT_LEVELS = [
  'FEDERAL',
  'APPEAL',
  'HIGH',
  'SESSIONS',
  'MAGISTRATE',
] as const

export type CourtLevel = (typeof COURT_LEVELS)[number]

// Parties involved in a legal matter
export interface DocumentParties {
  plaintiff?: string
  defendant?: string
  petitioner?: string
  respondent?: string
  appellant?: string
  appellee?: string
}

// Full document type (matches Prisma model)
export interface LegalDocument {
  id: string
  title: string
  content: string
  docType: DocType
  status: DocStatus
  version: number
  clientId: string | null
  caseNumber: string | null
  court: CourtLevel | null
  jurisdiction: string | null
  tags: string[]
  parties: DocumentParties | null
  fileUrl: string | null
  fileSize: number | null
  mimeType: string | null
  createdBy: string | null
  updatedBy: string | null
  reviewedBy: string | null
  reviewedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// Document list item (subset for list views)
export interface DocumentListItem {
  id: string
  title: string
  docType: DocType
  status: DocStatus
  clientId: string | null
  caseNumber: string | null
  court: CourtLevel | null
  tags: string[]
  version: number
  createdAt: Date
  updatedAt: Date
  createdBy: string | null
}

// Create document input
export interface CreateDocumentInput {
  title: string
  content: string
  docType: DocType
  status?: DocStatus
  clientId?: string
  caseNumber?: string
  court?: CourtLevel
  jurisdiction?: string
  tags?: string[]
  parties?: DocumentParties
  fileUrl?: string
  fileSize?: number
  mimeType?: string
  createdBy?: string
}

// Update document input
export interface UpdateDocumentInput {
  id: string
  title?: string
  content?: string
  docType?: DocType
  status?: DocStatus
  clientId?: string | null
  caseNumber?: string | null
  court?: CourtLevel | null
  jurisdiction?: string | null
  tags?: string[]
  parties?: DocumentParties
  fileUrl?: string | null
  fileSize?: number | null
  mimeType?: string | null
  updatedBy?: string
}

// List documents filter
export interface ListDocumentsFilter {
  cursor?: string
  limit?: number
  docType?: DocType
  status?: DocStatus
  clientId?: string
  caseNumber?: string
  court?: CourtLevel
  tags?: string[]
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
}

// Paginated response
export interface PaginatedDocuments {
  documents: DocumentListItem[]
  nextCursor: string | undefined
  hasMore: boolean
}

// Document statistics
export interface DocumentStats {
  total: number
  byStatus: Partial<Record<DocStatus, number>>
  byType: Partial<Record<DocType, number>>
  recentActivity: number
}

// Document labels for UI
export const DOC_TYPE_LABELS: Record<DocType, string> = {
  CONTRACT: 'Contract',
  BRIEF: 'Brief',
  MOTION: 'Motion',
  MEMORANDUM: 'Memorandum',
  PLEADING: 'Pleading',
  AGREEMENT: 'Agreement',
  LETTER: 'Letter',
  OTHER: 'Other',
}

export const DOC_STATUS_LABELS: Record<DocStatus, string> = {
  draft: 'Draft',
  review: 'Under Review',
  approved: 'Approved',
  archived: 'Archived',
}

export const COURT_LEVEL_LABELS: Record<CourtLevel, string> = {
  FEDERAL: 'Federal Court',
  APPEAL: 'Court of Appeal',
  HIGH: 'High Court',
  SESSIONS: 'Sessions Court',
  MAGISTRATE: 'Magistrate Court',
}
