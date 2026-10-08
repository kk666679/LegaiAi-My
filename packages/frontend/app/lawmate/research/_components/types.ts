// app/lawmate/research/_components/types.ts

export type AuthorityKind =
  | "case"
  | "statute"
  | "regulation"
  | "practice-direction"
  | "secondary"
  | "treaty"
  | "constitutional"
  | "circular";

export type AuthorityCourt =
  | "federal-court"
  | "court-of-appeal"
  | "high-court"
  | "sessions-court"
  | "magistrate-court"
  | "industrial-court"
  | "syariah"
  | "tribunal";

export type AuthorityJurisdiction = "MY" | "SG" | "UK" | "AU" | "HK" | "other";

export type ResearchStatus =
  | "queued"
  | "running"
  | "reasoning"
  | "complete"
  | "failed"
  | "cancelled";

export type FindingKind =
  | "holding"
  | "ratio"
  | "obiter"
  | "distinguishing"
  | "analogy"
  | "contradiction"
  | "gap";

export interface ResearchQuery {
  id: string;
  text: string;
  scope: ResearchScope;
  createdAt: string;
}

export interface ResearchScope {
  jurisdictions: AuthorityJurisdiction[];
  kinds: AuthorityKind[];
  dateFrom?: string;
  dateTo?: string;
  courtLevels?: AuthorityCourt[];
  includeSecondary: boolean;
}

export interface Citation {
  id: string;
  /** Short form used in text, e.g. "[2024] 1 MLJ 100" */
  short: string;
  /** Full citation */
  full: string;
  kind: AuthorityKind;
  authorityId?: string;
}

export interface Authority {
  id: string;
  kind: AuthorityKind;
  court?: AuthorityCourt;
  jurisdiction: AuthorityJurisdiction;
  title: string;
  citation: Citation;
  year: number;
  bench?: string[];
  judge?: string;
  summary: string;
  /** Longer excerpt / headnote */
  headnote?: string;
  /** Full text, when available */
  fullText?: string;
  /** Key paragraph references */
  keyParagraphs?: Array<{ para: number; note: string; text: string }>;
  url?: string;
  /** AI-derived relevance score, 0..1 */
  relevance?: number;
  /** AI confidence in this being the right authority, 0..1 */
  confidence?: number;
  /** Why the AI retrieved it */
  rationale?: string;
  /** Citations this authority relies on */
  cites?: string[];
  /** Authorities that cite this one */
  citedBy?: string[];
  tags?: string[];
}

export interface Finding {
  id: string;
  kind: FindingKind;
  title: string;
  summary: string;
  authorityIds: string[];
  confidence?: number;
  paragraph?: number;
}

export interface ResearchReasoningStep {
  id: string;
  kind: "issue" | "rule" | "application" | "conclusion" | "search" | "filter" | "rank";
  label: string;
  status: "pending" | "active" | "complete";
  detail?: string;
  authorityIds?: string[];
  confidence?: number;
}

export interface ResearchMemo {
  id: string;
  sessionId: string;
  title: string;
  /** Markdown */
  body: string;
  status: "draft" | "review" | "final";
  createdAt: string;
  updatedAt: string;
  authorName?: string;
}

export interface ResearchSession {
  id: string;
  title: string;
  query: ResearchQuery;
  status: ResearchStatus;
  createdAt: string;
  updatedAt: string;
  authorityCount: number;
  findingCount: number;
  avgConfidence?: number;
  /** Duration in ms */
  durationMs?: number;
  /** Owner */
  ownerName?: string;
  /** Matter this research belongs to */
  matterId?: string;
  matterName?: string;
  /** Client */
  clientName?: string;
  /** Saved? */
  saved?: boolean;
  /** Tags */
  tags?: string[];
  memoId?: string;
}

export interface ResearchCollection {
  id: string;
  name: string;
  description?: string;
  sessionCount: number;
  createdAt: string;
  updatedAt: string;
  color?: string;
  matterId?: string;
}

export interface ResearchStats {
  totalSessions: number;
  sessionsThisWeek: number;
  savedSessions: number;
  totalAuthorities: number;
  avgConfidence: number;
  avgDurationMs: number;
  byKind: Record<AuthorityKind, number>;
}

export interface ResearchFilters {
  query?: string;
  kinds?: AuthorityKind[];
  courts?: AuthorityCourt[];
  jurisdictions?: AuthorityJurisdiction[];
  minConfidence?: number;
  minRelevance?: number;
  yearsFrom?: number;
}

export type ResearchSortKey = "relevance" | "confidence" | "year" | "court";
export type ResearchSortDirection = "asc" | "desc";
export interface ResearchSort {
  key: ResearchSortKey;
  direction: ResearchSortDirection;
}

export type ResultsView = "list" | "cards" | "table";

export interface ResearchCapabilities {
  canSearch: boolean;
  canSave: boolean;
  canExport: boolean;
  canEditMemo: boolean;
  canDelete: boolean;
  canShare: boolean;
}

export const AUTHORITY_KIND_LABELS: Record<AuthorityKind, string> = {
  case: "Case",
  statute: "Statute",
  regulation: "Regulation",
  "practice-direction": "Practice direction",
  secondary: "Secondary source",
  treaty: "Treaty",
  constitutional: "Constitutional",
  circular: "Circular",
};

export const AUTHORITY_COURT_LABELS: Record<AuthorityCourt, string> = {
  "federal-court": "Federal Court",
  "court-of-appeal": "Court of Appeal",
  "high-court": "High Court",
  "sessions-court": "Sessions Court",
  "magistrate-court": "Magistrate Court",
  "industrial-court": "Industrial Court",
  syariah: "Syariah Court",
  tribunal: "Tribunal",
};

export const FINDING_KIND_LABELS: Record<FindingKind, string> = {
  holding: "Holding",
  ratio: "Ratio decidendi",
  obiter: "Obiter dictum",
  distinguishing: "Distinguishing",
  analogy: "Analogy",
  contradiction: "Contradiction",
  gap: "Gap",
};
