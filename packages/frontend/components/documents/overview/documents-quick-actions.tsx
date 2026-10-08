// components/documents/overview/documents-quick-actions.tsx
"use client";

import * as React from "react";
import {
  FilePlus2,
  Upload,
  Sparkles,
  FileSignature,
  PenLine,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface DocumentsQuickActionsProps {
  onCreate?: () => void;
  onUpload?: () => void;
  onAnalyse?: () => void;
  onContracts?: () => void;
  onDraftingStudio?: () => void;
}

export function DocumentsQuickActions({
  onCreate,
  onUpload,
  onAnalyse,
  onContracts,
  onDraftingStudio,
}: DocumentsQuickActionsProps) {
  const actions = [
    { label: "Create document", icon: FilePlus2, onClick: onCreate },
    { label: "Upload document", icon: Upload, onClick: onUpload },
    { label: "Analyse document", icon: Sparkles, onClick: onAnalyse },
    { label: "Contracts", icon: FileSignature, onClick: onContracts },
    { label: "Drafting Studio", icon: PenLine, onClick: onDraftingStudio },
  ];

  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-medium">Quick actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => (
          <Button
            key={a.label}
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={a.onClick}
          >
            <a.icon className="size-4" />
            {a.label}
          </Button>
        ))}
      </div>
    </Card>
  );
}
