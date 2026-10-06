// components/contracts/types.ts
import type { ReactNode } from "react";

export type ContractStatus =
  | "draft"
  | "in-negotiation"
  | "pending-approval"
  | "executed"
  | "active"
  | "expiring"
  | "expired"
  | "terminated"
  | "renewed"
  | "archived";

export type ContractType =
  | "employment"
  | "services"
  | "nda"
  | "lease"
  | "license"
  | "supply"
  | "distribution"
  | "partnership"
  | "loan"
  | "guarantee"
  | "settlement"
  | "mou"
  | "other";

export type ClauseCategory =
  | "liability"
  | "indemnity"
  | "termination"
  | "payment"
  | "confidentiality"
  | "intellectual-property"
  | "data-protection"
  | "force-majeure"
  | "dispute-resolution"
  | "governing-law"
  | "assignment"
  | "warranty"
  | "representation"
  | "non-compete"
  | "non-solicit"
  | "compliance"
  | "insurance"
  | "audit"
  | "other";

export type RiskSeverity = "low" | "medium" | "high" | "critical";
export type RiskCategory =
  | "legal"
  | "commercial"
  | "operational"
  | "regulatory"
  | "financial"
  | "reputational"
  | "compliance";

export type ObligationStatus = "pending" | "in-progress" | "met" | "overdue" | "waived" | "disputed";
export type ObligationFrequency = "one-time" | "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "on-event";

export type PlaybookPosition = "preferred" | "acceptable" | "fallback" | "walk-away";
export type DeviationSeverity = "none" | "minor" | "material" | "critical";

export type ApprovalStatus = "pending" | "approved" | "rejected" | "changes-requested";

export type RenewalType = "auto" | "manual" | "notice-required";

export interface ContractParty {
  id: string;
  name: string;
  role: "client" | "counterparty" | "guarantor" | "witness" | "third-party" | "assignee";
  entityType?: "individual" | "company" | "government" | "partnership";
  registrationNumber?: string;
  address?: string;
  contactName?: string;
  contactEmail?: string;
  signatory?: string;
  signatoryTitle?: string;
}

export interface ContractClause {
  id: string;
  contractId: string;
  number?: string;
  heading: string;
  body: string;
  category: ClauseCategory;
  riskLevel?: RiskSeverity;
  playbookDeviation?: DeviationSeverity;
  playbookNote?: string;
  crossReferences?: string[];
  pageNumber?: number;
  confidence?: number;
}

export interface ContractRisk {
  id: string;
  contractId: string;
  title: string;
  description: string;
  category: RiskCategory;
  severity: RiskSeverity;
  likelihood: "rare" | "unlikely" | "possible" | "likely" | "almost-certain";
  impact: "negligible" | "minor" | "moderate" | "major" | "severe";
  mitigation?: string;
  clauseIds?: string[];
  confidence?: number;
}

export interface ContractObligation {
  id: string;
  contractId: string;
  partyId: string;
  partyName: string;
  description: string;
  clauseId?: string;
  status: ObligationStatus;
  frequency?: ObligationFrequency;
  dueAt?: string;
  nextDueAt?: string;
  completedAt?: string;
  responsibleId?: string;
  responsibleName?: string;
  amount?: number;
  currency?: string;
  notes?: string;
}

export interface ContractTerm {
  id: string;
  label: string;
  value: string;
  category?: string;
  clauseId?: string;
  confidence?: number;
}

export interface ContractValue {
  id: string;
  label: string;
  amount: number;
  currency?: string;
  kind: "contract-value" | "cap" | "deductible" | "fee" | "penalty" | "retainer" | "contingency";
  clauseId?: string;
}

export interface ContractMilestone {
  id: string;
  contractId: string;
  label: string;
  date: string;
  kind: "effective" | "commencement" | "renewal" | "expiry" | "notice" | "payment" | "delivery" | "acceptance" | "custom";
  completed?: boolean;
  clauseId?: string;
}

export interface PlaybookRule {
  id: string;
  clauseCategory: ClauseCategory;
  preferred: string;
  acceptable: string;
  fallback: string;
  walkAway: string;
  rationale?: string;
  escalationPolicy?: string;
}

export interface PlaybookDeviation {
  id: string;
  contractId: string;
  clauseId: string;
  clauseHeading: string;
  position: PlaybookPosition;
  deviation: DeviationSeverity;
  expected: string;
  actual: string;
  suggestion?: string;
  resolved?: boolean;
}

export interface NegotiationRound {
  id: string;
  contractId: string;
  roundNumber: number;
  fromParty: string;
  toParty: string;
  sentAt: string;
  status: "sent" | "received" | "accepted" | "rejected" | "in-progress";
  summary?: string;
  versionId?: string;
  redlineCount?: number;
}

export interface ApprovalRequest {
  id: string;
  contractId: string;
  requestedBy: string;
  requestedAt: string;
  approverId: string;
  approverName: string;
  status: ApprovalStatus;
  decidedAt?: string;
  comments?: string;
  reason?: string;
  threshold?: { field: string; value: string; };
}

export interface RenewalAlert {
  id: string;
  contractId: string;
  contractName: string;
  type: RenewalType;
  triggerAt: string;
  noticeDays?: number;
  ownerId?: string;
  ownerName?: string;
  status: "upcoming" | "notified" | "actioned" | "dismissed" | "missed";
}

export interface Counterparty {
  id: string;
  name: string;
  entityType?: "individual" | "company" | "government" | "partnership";
  registrationNumber?: string;
  jurisdiction?: string;
  industry?: string;
  tier?: "strategic" | "key" | "standard" | "watchlist";
  riskRating?: RiskSeverity;
  contractCount?: number;
  totalValue?: number;
  currency?: string;
  primaryContact?: string;
  primaryEmail?: string;
  notes?: string;
  tags?: string[];
}

export interface ContractVersion {
  id: string;
  contractId: string;
  versionNumber: number;
  label: string;
  createdAt: string;
  authorName?: string;
  authorRole?: string;
  isCurrent?: boolean;
  isExecuted?: boolean;
  redlineCount?: number;
  summary?: string;
  documentId?: string;
}

export interface ContractActivityEvent {
  id: string;
  contractId: string;
  kind:
    | "created"
    | "updated"
    | "clause-extracted"
    | "risk-flagged"
    | "obligation-tracked"
    | "sent-for-negotiation"
    | "redline-received"
    | "sent-for-approval"
    | "approved"
    | "rejected"
    | "changes-requested"
    | "executed"
    | "renewed"
    | "terminated"
    | "archived"
    | "comment-added"
    | "deviation-flagged";
  actorId?: string;
  actorName?: string;
  timestamp: string;
  message?: string;
  metadata?: Record<string, unknown>;
}

export interface ContractTemplate {
  id: string;
  name: string;
  contractType: ContractType;
  jurisdiction?: string;
  description?: string;
  clauseCount?: number;
  tags?: string[];
  favourite?: boolean;
}

export interface ContractStats {
  total: number;
  active: number;
  inNegotiation: number;
  pendingApproval: number;
  expiring: number;
  overdueObligations: number;
  criticalRisks: number;
  totalValue: number;
  currency?: string;
}

export interface ContractFilters {
  query?: string;
  status?: ContractStatus[];
  type?: ContractType[];
  counterpartyId?: string[];
  ownerId?: string[];
  jurisdiction?: string[];
  riskSeverity?: RiskSeverity[];
  hasDeviations?: boolean;
  expiringWithinDays?: number;
  dateFrom?: string;
  dateTo?: string;
}

export type ContractSortKey = "name" | "counterparty" | "status" | "value" | "effectiveAt" | "expiresAt" | "updatedAt" | "risk";
export type ContractSortDirection = "asc" | "desc";
export interface ContractSort { key: ContractSortKey; direction: ContractSortDirection; }

export type ContractViewMode = "list" | "grid" | "table" | "kanban";

export interface Contract {
  id: string;
  name: string;
  type: ContractType;
  status: ContractStatus;
  counterpartyId?: string;
  counterpartyName?: string;
  matterId?: string;
  matterName?: string;
  ownerId?: string;
  ownerName?: string;
  jurisdiction?: string;
  governingLaw?: string;
  effectiveAt?: string;
  expiresAt?: string;
  renewalType?: RenewalType;
  noticeDays?: number;
  value?: number;
  currency?: string;
  parties?: ContractParty[];
  tags?: string[];
  favourite?: boolean;
  deviationCount?: number;
  criticalRiskCount?: number;
  overdueObligationCount?: number;
  documentId?: string;
  documentName?: string;
  aiSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContractCapabilities {
  canEdit: boolean;
  canAnalyse: boolean;
  canNegotiate: boolean;
  canApprove: boolean;
  canExecute: boolean;
  canRenew: boolean;
  canTerminate: boolean;
  canDelete: boolean;
}

export type { ReactNode };
