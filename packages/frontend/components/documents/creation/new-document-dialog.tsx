"use client";
import * as React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DocumentTemplate } from "../types";
import { DocumentTypeSelector } from "./document-type-selector";
import { DocumentTemplateSelector } from "./document-template-selector";
import { DocumentCreationForm, type DocumentCreationFormValues } from "./document-creation-form";
import { DocumentCreationPreview } from "./document-creation-preview";

export interface NewDocumentDialogProps {
  open: boolean; onOpenChange: (open: boolean) => void;
  templates?: DocumentTemplate[];
  onSubmit?: (values: DocumentCreationFormValues & { templateId?: string; typeId?: string }) => void;
}

const INITIAL: DocumentCreationFormValues = { name: "", description: "", category: "", jurisdiction: "Malaysia", language: "English" };

export function NewDocumentDialog({ open, onOpenChange, templates = [], onSubmit }: NewDocumentDialogProps) {
  const [tab, setTab] = React.useState<"type" | "template" | "upload">("type");
  const [typeId, setTypeId] = React.useState<string>("contract");
  const [templateId, setTemplateId] = React.useState<string>("");
  const [values, setValues] = React.useState<DocumentCreationFormValues>(INITIAL);
  const template = templates.find((t) => t.id === templateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create document</DialogTitle>
          <DialogDescription>Start from a type, template, or upload an existing file.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="type">Choose type</TabsTrigger>
            <TabsTrigger value="template">Use template</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="type" className="mt-4"><DocumentTypeSelector value={typeId} onChange={setTypeId} /></TabsContent>
          <TabsContent value="template" className="mt-4">
            <DocumentTemplateSelector templates={templates} onSelect={(t) => { setTemplateId(t.id); setValues((v) => ({ ...v, name: v.name || t.name })); }} />
          </TabsContent>
          <TabsContent value="upload" className="mt-4"><p className="text-sm text-muted-foreground">Upload flows through the <code>DocumentUploadDialog</code> component.</p></TabsContent>
        </Tabs>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <DocumentCreationForm value={values} onChange={setValues} />
          <DocumentCreationPreview values={values} templateLabel={template?.name} typeLabel={typeId} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => onSubmit?.({ ...values, templateId, typeId })} disabled={!values.name.trim()}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
