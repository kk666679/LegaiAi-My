import type { ContractTemplate } from "../types";

export const DEFAULT_CONTRACT_TEMPLATES: ContractTemplate[] = [
  { id: "nda-mutual", name: "Mutual NDA", contractType: "nda", jurisdiction: "Malaysia", description: "Standard mutual non-disclosure agreement.", clauseCount: 12, tags: ["confidentiality"] },
  { id: "services-agreement", name: "Services Agreement", contractType: "services", jurisdiction: "Malaysia", description: "Services engagement with SOW and SLA annexes.", clauseCount: 24, tags: ["services", "sow"] },
  { id: "employment-standard", name: "Employment Agreement", contractType: "employment", jurisdiction: "Malaysia", description: "Standard employment terms for permanent staff.", clauseCount: 20, tags: ["employment"] },
  { id: "lease-commercial", name: "Commercial Lease", contractType: "lease", jurisdiction: "Malaysia", description: "Commercial premises lease with standard covenants.", clauseCount: 28, tags: ["property"] },
  { id: "settlement-agreement", name: "Settlement Agreement", contractType: "settlement", jurisdiction: "Malaysia", description: "Full and final settlement with mutual releases.", clauseCount: 15, tags: ["litigation"] },
  { id: "mou-standard", name: "Memorandum of Understanding", contractType: "mou", jurisdiction: "Malaysia", description: "Non-binding MOU for early-stage collaboration.", clauseCount: 10, tags: ["collaboration"] },
  { id: "loan-facility", name: "Loan Facility Agreement", contractType: "loan", jurisdiction: "Malaysia", description: "Term loan facility with standard covenants.", clauseCount: 32, tags: ["finance"] },
  { id: "distribution", name: "Distribution Agreement", contractType: "distribution", jurisdiction: "Malaysia", description: "Non-exclusive distribution with performance targets.", clauseCount: 26, tags: ["commercial"] },
];
