"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentCreationForm, type DocumentCreationFormValues } from "@/components/documents/creation/document-creation-form";
import { DocumentCreationPreview } from "@/components/documents/creation/document-creation-preview";
import { DocumentTemplateSelector } from "@/components/documents/creation/document-template-selector";
import { DocumentTypeSelector } from "@/components/documents/creation/document-type-selector";
import type { DocumentTemplate } from "@/components/documents/types";
import { DocumentDropzone } from "@/components/documents/upload/document-dropzone";
import { useDocumentMutations, type CreateDocumentInput } from "@/hooks/useDocuments";
import { toast } from "sonner";

const DOC_TYPE_BY_ID: Record<string, CreateDocumentInput["docType"]> = {
  contract: "CONTRACT",
  letter: "LETTER",
  memo: "MEMORANDUM",
  opinion: "OTHER",
};

export function NewDocumentPage() {
  const router = useRouter();
  const docMutations = useDocumentMutations();
  const [isPending, startTransition] = React.useTransition();
  const [tab, setTab] = React.useState<"type" | "template" | "upload">("type");
  const [typeId, setTypeId] = React.useState("contract");
  const [templateId, setTemplateId] = React.useState<string>("");
  const [files, setFiles] = React.useState<File[]>([]);
  const [values, setValues] = React.useState<DocumentCreationFormValues>({
    name: "", description: "", category: "", jurisdiction: "Malaysia", language: "English",
  });
  const [templates] = React.useState<DocumentTemplate[]>([]);

  const handleCreate = () => {
    if (!values.name.trim()) { toast.error("Name is required"); return; }
    startTransition(async () => {
      try {
        const created = await docMutations.create({
          title: values.name.trim(),
          content: values.description?.trim() || "New document",
          docType: DOC_TYPE_BY_ID[typeId] ?? "OTHER",
          ...(values.jurisdiction ? { jurisdiction: values.jurisdiction } : {}),
        });
        toast.success("Document created");
        router.push(`/legalai/documents/${created.id}/preview`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to create document");
      }
    });
  };

  const handleUpload = () => {
    if (files.length === 0) { toast.error("Choose at least one file to upload"); return; }
    startTransition(async () => {
      const uploaded = await Promise.all(files.map(async (file) => {
        try {
          const formData = new FormData();
          formData.append("file", file);
          const response = await fetch("/api/blob/upload", { method: "POST", body: formData });
          if (!response.ok) throw new Error(`Upload failed (${response.status})`);
          const blob = await response.json() as {
            pathname?: string;
            size?: number;
            contentType?: string;
          };
          if (!blob.pathname) throw new Error("Upload returned no pathname");

          const fileUrl = `${window.location.origin}/api/blob/file?pathname=${encodeURIComponent(blob.pathname)}`;
          const created = await docMutations.create({
            title: file.name,
            content: `Uploaded file: ${file.name}`,
            docType: "OTHER",
            fileUrl,
            fileSize: blob.size ?? file.size,
            mimeType: blob.contentType ?? file.type,
          });
          return { id: created.id, name: file.name };
        } catch (err) {
          return {
            error: err instanceof Error ? err.message : `Failed to upload ${file.name}`,
            name: file.name,
          };
        }
      }));

      const successfulUploads = uploaded.filter((result): result is { id: string; name: string } => "id" in result);
      const failedUploads = uploaded.filter((result): result is { error: string; name: string } => "error" in result);
      successfulUploads.forEach(({ name }) => toast.success(`Uploaded ${name}`));
      failedUploads.forEach(({ name, error }) => toast.error(`${name}: ${error}`));

      const lastCreatedId = successfulUploads.at(-1)?.id;
      if (lastCreatedId) router.push(`/legalai/documents/${lastCreatedId}/preview`);
    });
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">New</p>
        <h1 className="text-lg font-semibold">Create document</h1>
      </header>
      <div className="mx-auto w-full max-w-5xl space-y-6 p-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList>
            <TabsTrigger value="type">Choose type</TabsTrigger>
            <TabsTrigger value="template">Use template</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
          <TabsContent value="type" className="mt-4"><DocumentTypeSelector value={typeId} onChange={setTypeId} /></TabsContent>
          <TabsContent value="template" className="mt-4">
            <DocumentTemplateSelector
              templates={templates}
              onSelect={(t) => { setTemplateId(t.id); setValues((v) => ({ ...v, name: v.name || t.name })); }}
            />
          </TabsContent>
          <TabsContent value="upload" className="mt-4">
            <DocumentDropzone onFiles={setFiles} disabled={isPending} />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <DocumentCreationForm value={values} onChange={setValues} />
          </Card>
          <DocumentCreationPreview values={values} typeLabel={typeId} templateLabel={templates.find((t) => t.id === templateId)?.name} />
        </div>

        <div className="flex gap-2">
          <Button
            onClick={tab === "upload" ? handleUpload : handleCreate}
            disabled={isPending || (tab === "upload" ? files.length === 0 : !values.name.trim())}
          >
            {isPending ? "Saving..." : tab === "upload" ? "Upload files" : "Create document"}
          </Button>
          <Button variant="ghost" onClick={() => router.push("/legalai/documents")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
