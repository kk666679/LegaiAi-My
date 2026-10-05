// components/documents/contracts/contract-card.tsx
"use client";

import * as React from "react";
import { FileSignature } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { LegalDocument } from "../types";
import { DocumentStatusIndicator } from "../status/document-status-indicator";

export interface ContractCardProps {
  contract: LegalDocument;
  onOpen?: (doc: LegalDocument) => void;
}

export function ContractCard({ contract, onOpen }: ContractCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(contract)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onOpen?.(contract);
      }}
      className="flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <FileSignature className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{contract.name}</p>
          <p className="truncate text-xs text-muted-foreground">
            {contract.parties?.map((p) => p.name).join(" · ") ??
              contract.category ??
              "Contract"}
          </p>
        </div>
        <DocumentStatusIndicator status={contract.status} compact />
      </div>
      <div className="text-xs text-muted-foreground">
        Updated {new Date(contract.updatedAt).toLocaleDateString()}
      </div>
    </Card>
  );
}
