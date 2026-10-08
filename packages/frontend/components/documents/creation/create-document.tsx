"use client";
import * as React from "react";
import { NewDocumentDialog } from "./new-document-dialog";
import type { DocumentCreationFormValues } from "./document-creation-form";
import type { DocumentTemplate } from "../types";

export interface CreateDocumentProps {
  templates?: DocumentTemplate[];
  trigger?: React.ReactNode;
  onSubmit?: (values: DocumentCreationFormValues & { templateId?: string; typeId?: string }) => void;
}

export function CreateDocument({ templates, trigger, onSubmit }: CreateDocumentProps) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger ?? null}</span>
      <NewDocumentDialog open={open} onOpenChange={setOpen} templates={templates} onSubmit={(v) => { onSubmit?.(v); setOpen(false); }} />
    </>
  );
}
