import type { ClauseCategory } from "../types";

export const CLAUSE_CATEGORY_LABELS: Record<ClauseCategory, string> = {
  liability: "Liability", indemnity: "Indemnity", termination: "Termination", payment: "Payment",
  confidentiality: "Confidentiality", "intellectual-property": "Intellectual property",
  "data-protection": "Data protection", "force-majeure": "Force majeure",
  "dispute-resolution": "Dispute resolution", "governing-law": "Governing law",
  assignment: "Assignment", warranty: "Warranty", representation: "Representation",
  "non-compete": "Non-compete", "non-solicit": "Non-solicit", compliance: "Compliance",
  insurance: "Insurance", audit: "Audit", other: "Other",
};

export const CLAUSE_CATEGORIES: ClauseCategory[] = Object.keys(CLAUSE_CATEGORY_LABELS) as ClauseCategory[];
