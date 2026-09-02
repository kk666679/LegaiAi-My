export type Severity = "info" | "low" | "medium" | "high";
export type SourceType = "act" | "regulation" | "case" | "guideline" | "government" | "other";
export type Jurisdiction = "Malaysia" | "Singapore" | "United Kingdom" | "Other";
export type LegalArea =
  | "Employment"
  | "Contract"
  | "Corporate"
  | "Compliance"
  | "Data Protection"
  | "Property"
  | "Litigation"
  | "Other";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "lawyer" | "paralegal" | "business" | "admin";
  organisation?: string;
  avatarUrl?: string;
}

export interface LegalSource {
  id: string;
  title: string;
  type: SourceType;
  authority: string;
  section?: string;
  jurisdiction: Jurisdiction;
  area?: LegalArea;
  url?: string;
  publishedAt?: string;
  excerpt?: string;
  verified: boolean;
  relevance?: number;
}

export interface Citation {
  index: number;
  source: LegalSource;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  status: "uploading" | "processing" | "ready" | "failed";
  progress?: number;
  errorMessage?: string;
  documentId?: string;
}

export type ToolStatus = "pending" | "running" | "complete" | "failed";

export interface ToolExecution {
  id: string;
  name: string;
  description?: string;
  status: ToolStatus;
  startedAt?: string;
  completedAt?: string;
  output?: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  preview?: string;
  matterId?: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
  citations?: Citation[];
  sources?: LegalSource[];
  toolExecutions?: ToolExecution[];
  reasoningSteps?: ReasoningStep[];
  suggestions?: string[];
  attachments?: Attachment[];
  verified?: boolean;
}

export interface ReasoningStep {
  id: string;
  label: string;
  status: ToolStatus;
  detail?: string;
}

export type DocumentStatus =
  | "uploading"
  | "processing"
  | "ready"
  | "failed"
  | "archived";

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  status: DocumentStatus;
  matterId?: string;
  classification: "public" | "internal" | "confidential" | "privileged";
  pageCount?: number;
  url?: string;
}

export type FindingKind =
  | "party"
  | "date"
  | "obligation"
  | "right"
  | "restriction"
  | "penalty"
  | "termination"
  | "payment"
  | "confidentiality"
  | "risk"
  | "missing_clause"
  | "conflict"
  | "ambiguity";

export interface Finding {
  id: string;
  kind: FindingKind;
  title: string;
  detail: string;
  excerpt?: string;
  severity: Severity;
  page?: number;
  startOffset?: number;
  endOffset?: number;
  recommendation?: string;
}

export interface DocumentAnalysis {
  id: string;
  documentId: string;
  status: "pending" | "running" | "complete" | "failed";
  summary?: string;
  findings: Finding[];
  parties: string[];
  dates: string[];
  generatedAt: string;
}

export type RiskCategory =
  | "Legal"
  | "Compliance"
  | "Contractual"
  | "Employment"
  | "Financial"
  | "Operational"
  | "Documentation";

export interface RiskItem {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  category: RiskCategory;
  matterId?: string;
  documentId?: string;
  createdAt: string;
}

export type MatterStatus = "active" | "pending" | "review" | "completed" | "archived";

export interface Matter {
  id: string;
  number: string;
  name: string;
  description?: string;
  client?: string;
  status: MatterStatus;
  priority: "low" | "medium" | "high";
  area?: LegalArea;
  documentsCount: number;
  conversationsCount: number;
  tasksCount: number;
  researchCount: number;
  updatedAt: string;
  classification: "public" | "internal" | "confidential" | "privileged";
}

export type TaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface LegalTask {
  id: string;
  title: string;
  description?: string;
  matterId?: string;
  matterName?: string;
  assignee?: string;
  dueDate?: string;
  priority: "low" | "medium" | "high";
  status: TaskStatus;
  notes?: string;
}

export type NotificationKind =
  | "document"
  | "analysis"
  | "task"
  | "matter"
  | "research"
  | "system"
  | "ai";

export interface AppNotification {
  id: string;
  kind: NotificationKind;
  title: string;
  body?: string;
  href?: string;
  read: boolean;
  createdAt: string;
}

export type DraftTemplate =
  | "employment_agreement"
  | "warning_letter"
  | "show_cause_letter"
  | "company_policy"
  | "hostel_rules"
  | "property_acknowledgement"
  | "hr_notice"
  | "legal_letter"
  | "contract_clause"
  | "internal_memo"
  | "custom";

export interface Draft {
  id: string;
  title: string;
  template?: DraftTemplate;
  body: string;
  matterId?: string;
  updatedAt: string;
  status: "draft" | "review" | "final";
}

export interface SavedItem {
  id: string;
  kind: "source" | "answer" | "clause" | "document" | "research";
  title: string;
  body?: string;
  href?: string;
  tags?: string[];
  matterId?: string;
  savedAt: string;
}

export interface ResearchResult {
  source: LegalSource;
  summary: string;
  citation: string;
  relevance: number;
  date?: string;
}

export interface AIUsage {
  questionsAsked: number;
  documentsAnalysed: number;
  draftsGenerated: number;
  researchSessions: number;
}

export interface DashboardMetrics {
  usage: AIUsage;
  activeMatters: number;
  highPriorityMatters: number;
  totalDocuments: number;
  processingDocuments: number;
  risks: { high: number; medium: number; low: number };
  tasks: { today: number; overdue: number; upcoming: number };
}

export interface RecentActivity {
  id: string;
  kind: "conversation" | "document" | "research" | "draft" | "matter" | "analysis";
  title: string;
  detail?: string;
  href?: string;
  at: string;
}

export interface ComposerContext {
  jurisdiction?: Jurisdiction;
  area?: LegalArea;
  matterId?: string;
  sourceFilter?: SourceType[];
  model?: string;
}

export interface PromptSuggestion {
  id: string;
  label: string;
  prompt: string;
  category: "review" | "research" | "draft" | "analyse" | "compare";
}