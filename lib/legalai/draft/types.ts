export type DocumentType = "WRIT" | "AFFIDAVIT" | "SUBMISSION" | "COMPLAINT";
export type Tone = "neutral" | "adversarial" | "persuasive";
export type Format = "markdown" | "docx" | "pdf";

export interface Parties {
  plaintiff: string;
  defendant: string;
  court: string;
  caseNumber?: string;
}

export interface DraftRequest {
  docType: DocumentType;
  parties: Parties;
  facts: string;
  reliefSought?: string;
  tone: Tone;
  format: Format;
  citations: string[];
}

export interface DraftResponse {
  jobId: string;
  document: string;
  status: "queued" | "processing" | "completed" | "failed";
  citationsValidated: boolean;
  warnings?: string[];
}

export interface ValidationResult {
  valid: boolean;
  hasOverruled: boolean;
  citations: CitationValidation[];
  summary: {
    total: number;
    valid: number;
    overruled: number;
    warning: number;
  };
}

export interface CitationValidation {
  citation: string;
  status: "valid" | "overruled" | "warning" | "invalid";
  message?: string;
  caseName?: string;
  year?: number;
}

