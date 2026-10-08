"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { trpcReact } from "@/clients";
import { useDocumentMutations } from "@/hooks/useDocuments";
import { StudioLayout } from "@/components/documents/studio/studio-layout";
import { StudioOutline, type OutlineSection } from "@/components/documents/studio/studio-outline";
import { StudioAIPanel, type StudioAIMessage } from "@/components/documents/studio/studio-ai-panel";
import { Button } from "@/components/ui/button";

const DOC_TYPE_LABEL: Record<string, string> = {
  CONTRACT: "Contract",
  BRIEF: "Brief",
  MOTION: "Motion",
  MEMORANDUM: "Memorandum",
  PLEADING: "Pleading",
  AGREEMENT: "Agreement",
  LETTER: "Letter",
  OTHER: "Other",
};

interface StudioClientProps {
  documentId?: string;
}

export function StudioClient({ documentId }: StudioClientProps) {
  const router = useRouter();
  const docMutations = useDocumentMutations();
  const [isPending, startTransition] = React.useTransition();
  const [saveError, setSaveError] = React.useState<string | null>(null);
  const [lastSaved, setLastSaved] = React.useState<string | null>(null);

  const {
    document: existing,
    isLoading: loadingExisting,
    error: existingError,
  } = trpcReact.documents.getById.useQuery(documentId ?? "", {
    enabled: !!documentId,
    retry: false,
  });

  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [docType, setDocType] = React.useState<string>("CONTRACT");
  const [sections, setSections] = React.useState<OutlineSection[]>([]);
  const [messages, setMessages] = React.useState<StudioAIMessage[]>([]);

  // Populate the editor when an existing document is loaded.
  React.useEffect(() => {
    if (existing && typeof existing === "object") {
      const doc = existing as {
        title?: string;
        content?: string;
        docType?: string;
      };
      setTitle(doc.title ?? "");
      setBody(doc.content ?? "");
      if (doc.docType) setDocType(doc.docType);
    }
  }, [existing]);

  const save = React.useCallback(
    (nextTitle: string, nextBody: string) => {
      if (!nextTitle.trim()) {
        setSaveError("Title is required");
        return;
      }
      setSaveError(null);
      startTransition(async () => {
        try {
          if (documentId) {
            await docMutations.update(documentId, {
              title: nextTitle.trim(),
              content: nextBody,
              docType: docType as "CONTRACT" | "BRIEF" | "MOTION" | "MEMORANDUM" | "PLEADING" | "AGREEMENT" | "LETTER" | "OTHER",
            });
          } else {
            const created = await docMutations.create({
              title: nextTitle.trim(),
              content: nextBody,
              docType: docType as "CONTRACT" | "BRIEF" | "MOTION" | "MEMORANDUM" | "PLEADING" | "AGREEMENT" | "LETTER" | "OTHER",
            });
            router.replace(`/lawmate/documents/${created.id}/studio`);
          }
          setLastSaved(new Date().toLocaleTimeString());
          toast.success(documentId ? "Document saved" : "Document created");
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to save document";
          setSaveError(message);
          toast.error(message);
        }
      });
    },
    [documentId, docType, docMutations, router],
  );

  // Debounced autosave while editing an existing document.
  React.useEffect(() => {
    if (!documentId || !existing) return;
    if (!title.trim() || title === (existing as { title?: string }).title) return;
    const handle = window.setTimeout(() => save(title, body), 1500);
    return () => window.clearTimeout(handle);
  }, [title, body, documentId, existing, save]);

  if (loadingExisting) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-muted-foreground">
        Loading document…
      </div>
    );
  }

  if (existingError && documentId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-destructive">Failed to load document.</p>
        <Button variant="outline" onClick={() => router.push("/lawmate/documents")}>
          Back to documents
        </Button>
      </div>
    );
  }

  return (
    <StudioLayout
      title={title}
      onTitleChange={setTitle}
      body={body}
      onBodyChange={setBody}
      sections={sections}
      messages={messages}
      onSave={() => save(title, body)}
      saving={isPending}
      lastSaved={lastSaved}
      saveError={saveError}
      docType={docType}
      onDocTypeChange={setDocType}
      docTypeLabel={DOC_TYPE_LABEL[docType] ?? docType}
    />
  );
}