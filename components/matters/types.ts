// components/matters/types.ts
import type { ReactNode } from "react";

export type MatterStatus =
  | "intake"
  | "open"
  | "on-hold"
  | "pending"
  | "review"
  | "billing"
  | "closed"
  | "archived"
  | "cancelled";

export type MatterPriority = "low" | "normal" | "high" | "urgent";

export type MatterRole =
  | "partner"
  | "associate"
  | "paralegal"
  | "secretary"
  | "client"
  | "observer";

export type MatterPartyRole =
  | "client"
  | "co-client"
  | "opposing-party"
  | "opposing-counsel"
  | "witness"
  | "expert"
  | "third-party"
  | "court"
  | "regulator";

export type MatterTaskStatus =
  | "todo"
  | "in-progress"
  | "blocked"
  | "review"
  | "done"
  | "cancelled";

export type MatterDeadlineKind =
  | "limitation"
  | "filing"
  | "hearing"
  | "discovery"
  | "response"
  | "internal"
  | "statutory"
  | "renewal";

export type BillingArrangement = "hourly" | "fixed" | "contingency" | "retainer" | "pro-bono";

export type ConflictSeverity = "none" | "low" | "medium" | "high" | "blocker";

export interface MatterParty {
  id: string;
  name: string;
  role: MatterPartyRole;
  kind?: "individual" | "company" | "government" | "other";
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  isPrimary?: boolean;
  metadata?: Record<string, unknown>;
}

export interface MatterTeamMember {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: MatterRole;
  isLead?: boolean;
  billingRate?: number;
  joinedAt?: string;
}

export interface MatterTask {
  id: string;
  matterId: string;
  title: string;
  description?: string;
  status: MatterTaskStatus;
  priority: MatterPriority;
  assigneeId?: string;
  assigneeName?: string;
  dueAt?: string;
  createdAt: string;
  completedAt?: string;
  tags?: string[];
}

export interface MatterDeadline {
  id: string;
  matterId: string;
  title: string;
  kind: MatterDeadlineKind;
  dueAt: string;
  allDay?: boolean;
  location?: string;
  responsibleId?: string;
  responsibleName?: string;
  completed?: boolean;
  notes?: string;
}

export interface MatterTimeEntry {
  id: string;
  matterId: string;
  userId: string;
  userName: string;
  description: string;
  durationMinutes: number;
  billable: boolean;
  rate?: number;
  date: string;
  activity?: "research" | "drafting" | "meeting" | "court" | "call" | "review" | "travel" | "other";
}

export interface MatterInvoice {
  id: string;
  matterId: string;
  number: string;
  issuedAt: string;
  dueAt?: string;
  status: "draft" | "sent" | "paid" | "overdue" | "void";
  subtotal: number;
  tax?: number;
  total: number;
  currency?: string;
  paidAt?: string;
  lineItems?: number;
}

export interface MatterNote {
  id: string;
  matterId: string;
  authorId: string;
  authorName: string;
  body: string;
  pinned?: boolean;
  private?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MatterActivityEvent {
  id: string;
  matterId: string;
  kind:
    | "created"
    | "opened"
    | "updated"
    | "document-added"
    | "task-created"
    | "task-completed"
    | "deadline-added"
    | "deadline-met"
    | "time-logged"
    | "invoice-issued"
    | "payment-received"
    | "party-added"
    | "team-changed"
    | "note-added"
    | "status-changed"
    | "closed"
    | "reopened"
    | "archived";
  actorId?: string;
  actorName?: string;
  timestamp: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface MatterConflict {
  id: string;
  matterId?: string;
  query: string;
  severity: ConflictSeverity;
  matches: Array<{
    id: string;
    name: string;
    matchedOn: string;
    matterId?: string;
    matterName?: string;
    relationship?: string;
  }>;
  resolved?: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export interface MatterPermissionEntry {
  id: string;
  userId: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  role: MatterRole;
}

export interface MatterStats {
  total: number;
  open: number;
  onHold: number;
  pending: number;
  closed: number;
  conflictsFlagged: number;
  deadlinesThisWeek: number;
  unbilledHours: number;
  outstandingBalance: number;
}

export interface MatterFilters {
  query?: string;
  status?: MatterStatus[];
  practiceArea?: string[];
  priority?: MatterPriority[];
  teamMemberId?: string[];
  clientId?: string[];
  jurisdiction?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export type MatterSortKey = "openedAt" | "updatedAt" | "name" | "matterNumber" | "nextDeadline" | "status";
export type MatterSortDirection = "asc" | "desc";

export interface MatterSort {
  key: MatterSortKey;
  direction: MatterSortDirection;
}

export type MatterViewMode = "list" | "grid" | "table" | "kanban";

export interface Matter {
  id: string;
  matterNumber: string;
  name: string;
  description?: string;
  status: MatterStatus;
  priority: MatterPriority;
  practiceArea: string;
  jurisdiction?: string;
  clientId?: string;
  clientName?: string;
  parties?: MatterParty[];
  team?: MatterTeamMember[];
  leadId?: string;
  leadName?: string;
  billingArrangement?: BillingArrangement;
  budgetAmount?: number;
  currency?: string;
  openedAt: string;
  updatedAt: string;
  closedAt?: string;
  nextDeadlineAt?: string;
  taskCount?: number;
  openTaskCount?: number;
  documentCount?: number;
  unbilledMinutes?: number;
  outstandingBalance?: number;
  tags?: string[];
  favorite?: boolean;
  conflictFlagged?: boolean;
  aiSummary?: string;
}

export interface MatterTemplate {
  id: string;
  name: string;
  practiceArea: string;
  description?: string;
  defaultTasks?: string[];
  defaultDeadlines?: string[];
  tags?: string[];
}

export interface MatterCapabilities {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canClose: boolean;
  canReopen: boolean;
  canBill: boolean;
  canShare: boolean;
  canRunConflicts: boolean;
}

export type { ReactNode };
