"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DocumentCreationForm,
  DocumentCreationPreview,
  DocumentTemplateSelector,
  DocumentTypeSelector,
  type DocumentCreationFormValues,
  type DocumentTemplate,
} from "@/components/documents";
import { DocumentDropzone } from "@/components/documents/upload/document-dropzone";
import { toast } from "sonner";

export function NewDocumentPage() {
  const router = useRouter();
  const [tab, setTab] = React.useState<"type" | "template" | "upload">("type");
  const [typeId, setTypeId] = React.useState("contract");
  const [templateId, setTemplateId] = React.useState<string>("");
  const [values, setValues] = React.useState<DocumentCreationFormValues>({
    name: "", description: "", category: "", jurisdiction: "Malaysia", language: "English",
  });
  const [templates] = React.useState<DocumentTemplate[]>([]);

  const handleCreate = () => {
    if (!values.name.trim()) { toast.error("Name is required"); return; }
    toast.success("Document created");
    router.push(`/legalai/documents/${encodeURIComponent(values.name)}/preview`);
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
            <DocumentDropzone onFiles={(files) => { toast.success(`${files.length} file(s) ready to upload`); }} />
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-4">
            <DocumentCreationForm value={values} onChange={setValues} />
          </Card>
          <DocumentCreationPreview values={values} typeLabel={typeId} templateLabel={templates.find((t) => t.id === templateId)?.name} />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={!values.name.trim()}>Create document</Button>
          <Button variant="ghost" onClick={() => router.push("/legalai/documents")}>Cancel</Button>
        </div>
      </div>
    </div>
  );
}
