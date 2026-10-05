// components/documents/contracts/contracts-workspace.tsx
"use client";

import * as React from "react";
import type { LegalDocument } from "../types";
import { ContractCard } from "./contract-card";
import { DocumentEmpty } from "../status/document-empty";

export interface ContractsWorkspaceProps {
  contracts: LegalDocument[];
  onOpen?: (doc: LegalDocument) => void;
  onCreate?: () => void;
}

export function ContractsWorkspace({
  contracts,
  onOpen,
  onCreate,
}: ContractsWorkspaceProps) {
  if (!contracts.length) {
    return (
      <DocumentEmpty
        title="No contracts yet"
        description="Upload a contract or generate one with AI to begin tracking obligations and risks."
        primaryAction={onCreate ? { label: "Create contract", onClick: onCreate } : undefined}
      />
    );
  }
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 p-4">
      {contracts.map((c) => (
        <ContractCard key={c.id} contract={c} onOpen={onOpen} />
      ))}
    </div>
  );
}
