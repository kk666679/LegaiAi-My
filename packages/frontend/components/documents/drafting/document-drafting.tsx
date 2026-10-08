"use client";
import * as React from "react";
import { DraftingWorkspace, } from "./drafting-workspace";
import type { DraftingFormValues } from "./drafting-form";
import type { DraftingStep } from "./drafting-steps";

export interface DocumentDraftingProps {
  initialValues?: DraftingFormValues;
  initialBody?: string;
  onGenerate?: (values: DraftingFormValues) => Promise<{ body: string }> | void;
  onSave?: (values: DraftingFormValues, body: string) => void;
  onExport?: (format: "pdf" | "docx" | "md") => void;
}

const DEFAULT_STEPS: DraftingStep[] = [
  { id: "details", label: "Details", status: "current" },
  { id: "generate", label: "Generate", status: "pending" },
  { id: "review", label: "Review", status: "pending" },
  { id: "export", label: "Export", status: "pending" },
];

export function DocumentDrafting({ initialValues, initialBody = "", onGenerate, onSave, onExport }: DocumentDraftingProps) {
  const [values, setValues] = React.useState<DraftingFormValues>(initialValues ?? { title: "", jurisdiction: "Malaysia" });
  const [body, setBody] = React.useState(initialBody);
  const [busy, setBusy] = React.useState(false);

  const handleGenerate = async () => {
    setBusy(true);
    try {
      const r = await onGenerate?.(values);
      if (r && typeof r === "object" && "body" in r) setBody(String((r as { body: string }).body));
    } finally { setBusy(false); }
  };

  return <DraftingWorkspace steps={DEFAULT_STEPS} values={values} onValuesChange={setValues} body={body} busy={busy}
    onGenerate={handleGenerate} onSave={() => onSave?.(values, body)} onExport={() => onExport?.("pdf")} />;
}
