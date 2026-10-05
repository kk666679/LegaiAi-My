"use client";
import * as React from "react";
import type { DocumentParty, LegalDocument } from "../types";
import { DocumentWorkspaceLayout } from "../workspace/document-workspace-layout";
import { ContractSummary } from "./contract-summary";
import { ContractParties } from "./contract-parties";
import { ContractDates } from "./contract-dates";
import { ContractObligations, type Obligation } from "./contract-obligations";
import { ContractInsights, type ContractInsight } from "./contract-insights";
import { DocumentPreview } from "../preview/document-preview";

export interface ContractDetailProps {
  contract: LegalDocument;
  parties?: DocumentParty[];
  obligations?: Obligation[];
  insights?: ContractInsight[];
  effectiveAt?: string;
  expiresAt?: string;
  summary?: string;
}

export function ContractDetail({ contract, parties, obligations, insights, effectiveAt, expiresAt, summary }: ContractDetailProps) {
  return (
    <DocumentWorkspaceLayout
      document={contract}
      tabs={[
        { id: "preview", label: "Preview", content: <DocumentPreview document={contract} /> },
        { id: "summary", label: "Summary", content: <div className="p-4"><ContractSummary summary={summary} /></div> },
        { id: "parties", label: "Parties", content: <div className="p-4"><ContractParties parties={parties ?? contract.parties ?? undefined} /></div> },
        { id: "obligations", label: "Obligations", content: <div className="p-4"><ContractObligations obligations={obligations ?? []} /></div> },
        { id: "insights", label: "Insights", content: <div className="p-4"><ContractInsights insights={insights ?? []} /></div> },
      ]}
      contextSections={[{ title: "Dates", content: <ContractDates effectiveAt={effectiveAt} expiresAt={expiresAt} /> }]}
    />
  );
}
