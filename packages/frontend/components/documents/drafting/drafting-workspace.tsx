"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { DraftingSteps, type DraftingStep } from "./drafting-steps";
import { DraftingForm, type DraftingFormValues } from "./drafting-form";
import { DraftingPreview } from "./drafting-preview";
import { DraftingToolbar } from "./drafting-toolbar";
import { DraftingActions } from "./drafting-actions";

export interface DraftingWorkspaceProps {
  steps: DraftingStep[];
  values: DraftingFormValues;
  onValuesChange: (v: DraftingFormValues) => void;
  body: string;
  busy?: boolean;
  onGenerate?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onAction?: (id: string) => void;
}

export function DraftingWorkspace({ steps, values, onValuesChange, body, busy, onGenerate, onSave, onExport, onAction }: DraftingWorkspaceProps) {
  return (
    <div className="space-y-4 p-4">
      <Card className="p-3"><DraftingSteps steps={steps} /></Card>
      <DraftingToolbar busy={busy} canGenerate={Boolean(values.title)} onGenerate={onGenerate} onSave={onSave} onExport={onExport} />
      <DraftingActions onAction={onAction} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4"><DraftingForm value={values} onChange={onValuesChange} /></Card>
        <DraftingPreview body={body || "Your generated draft will appear here."} title={values.title} />
      </div>
    </div>
  );
}
