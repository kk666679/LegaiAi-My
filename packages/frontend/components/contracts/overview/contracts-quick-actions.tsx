"use client";
import * as React from "react";
import { BookOpen, FilePlus2, FileSignature, ListChecks, Play, ScrollText, Sparkles, Upload } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface ContractsQuickActionsProps {
  onNew?: () => void;
  onUpload?: () => void;
  onTemplates?: () => void;
  onPlaybooks?: () => void;
  onClauseLibrary?: () => void;
  onRunAnalysis?: () => void;
  onRenewals?: () => void;
}

export function ContractsQuickActions({ onNew, onUpload, onTemplates, onPlaybooks, onClauseLibrary, onRunAnalysis, onRenewals }: ContractsQuickActionsProps) {
  const actions = [
    { label: "New contract", icon: FilePlus2, onClick: onNew },
    { label: "Upload", icon: Upload, onClick: onUpload },
    { label: "Templates", icon: FileSignature, onClick: onTemplates },
    { label: "Playbooks", icon: ScrollText, onClick: onPlaybooks },
    { label: "Clause library", icon: BookOpen, onClick: onClauseLibrary },
    { label: "Run analysis", icon: Sparkles, onClick: onRunAnalysis },
    { label: "Renewals", icon: ListChecks, onClick: onRenewals },
  ];
  return (
    <Card className="p-4">
      <p className="mb-3 text-sm font-medium">Quick actions</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((a) => <Button key={a.label} variant="outline" size="sm" className="gap-2" onClick={a.onClick}><a.icon className="size-4" />{a.label}</Button>)}
      </div>
    </Card>
  );
}
