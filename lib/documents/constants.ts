// lib/documents/constants.ts
// Shared document constants. Must NOT carry a "use client" directive:
// shared/server-reachable modules import these at module scope, and a
// client-module export would arrive as a reference proxy during SSR.

export const DOC_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "approved", label: "Approved" },
  { value: "archived", label: "Archived" },
] as const;

export const DOC_TYPES = [
  { value: "CONTRACT", label: "Contract" },
  { value: "BRIEF", label: "Brief" },
  { value: "MOTION", label: "Motion" },
  { value: "MEMORANDUM", label: "Memorandum" },
  { value: "PLEADING", label: "Pleading" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "LETTER", label: "Letter" },
  { value: "OTHER", label: "Other" },
] as const;

export const DOC_COURTS = [
  { value: "FEDERAL", label: "Federal Court" },
  { value: "APPEAL", label: "Court of Appeal" },
  { value: "HIGH", label: "High Court" },
  { value: "SESSIONS", label: "Sessions Court" },
  { value: "MAGISTRATE", label: "Magistrates Court" },
] as const;

export type DocumentStatus = (typeof DOC_STATUSES)[number]["value"];
export type DocumentType = (typeof DOC_TYPES)[number]["value"];
export type DocumentCourt = (typeof DOC_COURTS)[number]["value"];
