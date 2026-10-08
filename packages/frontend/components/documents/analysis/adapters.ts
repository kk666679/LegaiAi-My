import type { Finding, FindingKind, Severity } from "@/types/lawmate";
import type { DocumentAnalysisFinding } from "../types";

const KIND_MAP: Record<FindingKind, DocumentAnalysisFinding["kind"]> = {
  party: "party",
  date: "date",
  obligation: "obligation",
  right: "clause",
  restriction: "clause",
  penalty: "obligation",
  termination: "obligation",
  payment: "obligation",
  confidentiality: "clause",
  risk: "risk",
  missing_clause: "clause",
  conflict: "risk",
  ambiguity: "clause",
};

const SEVERITY_MAP: Record<Severity, DocumentAnalysisFinding["severity"]> = {
  info: "low",
  low: "low",
  medium: "medium",
  high: "high",
};

export function toDocumentAnalysisFinding(
  finding: Finding
): DocumentAnalysisFinding {
  return {
    id: finding.id,
    kind: KIND_MAP[finding.kind] ?? "clause",
    title: finding.title,
    summary: finding.detail,
    severity: SEVERITY_MAP[finding.severity] ?? "low",
  };
}

export function toDocumentAnalysisFindings(
  findings: Finding[]
): DocumentAnalysisFinding[] {
  return findings.map(toDocumentAnalysisFinding);
}
