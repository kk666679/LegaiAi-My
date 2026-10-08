/**
 * Draft workflow types.
 */

export type CitationStatus =
  | 'PENDING' | 'VERIFIED' | 'UNVERIFIED' | 'INVALID' | 'CONFLICT' | 'ERROR';

export interface Citation {
  id: string;
  displayText: string;
  sourceId?: string;
  section?: string;
  jurisdiction?: string;
  status: CitationStatus;
  confidence?: number;
  explanation?: string;
}

export interface ValidationResult {
  ok: boolean;
  citations: Citation[];
  issues: Array<{ severity: 'error' | 'warning' | 'info'; message: string; path?: string }>;
  score: number;
}

export interface DraftDocument {
  id: string;
  title: string;
  content: string;
  docType: string;
  status: 'draft' | 'review' | 'approved' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface DraftRequest {
  title: string;
  docType: string;
  parties?: string;
  jurisdiction?: string;
  facts?: string;
  instructions?: string;
  templateId?: string;
}

export interface DraftFormState {
  title: string;
  docType: string;
  parties: string;
  jurisdiction: string;
  facts: string;
  instructions: string;
}
