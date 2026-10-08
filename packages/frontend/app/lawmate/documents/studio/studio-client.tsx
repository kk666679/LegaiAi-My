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
  const savedDraft = React.useRef({ title: "", body: "", docType: "CONTRACT" });
  const undoStack = React.useRef<string[]>([]);
  const redoStack = React.useRef<string[]>([]);
  const [, refreshHistory] = React.useReducer((value: number) => value + 1, 0);

  const changeBody = React.useCallback((nextBody: string) => {
    if (nextBody === body) return;
    undoStack.current.push(body);
    if (undoStack.current.length > 100) undoStack.current.shift();
    redoStack.current = [];
    setBody(nextBody);
    refreshHistory();
  }, [body]);

  const undo = React.useCallback(() => {
    const previous = undoStack.current.pop();
    if (previous === undefined) return;
    redoStack.current.push(body);
    setBody(previous);
    refreshHistory();
  }, [body]);

  const redo = React.useCallback(() => {
    const next = redoStack.current.pop();
    if (next === undefined) return;
    undoStack.current.push(body);
    setBody(next);
    refreshHistory();
  }, [body]);

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
      savedDraft.current = {
        title: doc.title ?? "",
        body: doc.content ?? "",
        docType: doc.docType ?? "CONTRACT",
      };
      undoStack.current = [];
      redoStack.current = [];
      refreshHistory();
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
          savedDraft.current = { title: nextTitle.trim(), body: nextBody, docType };
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

  // Debounced autosave while editing an existing document. Compare all editable
  // fields so body-only and document-type changes are persisted as well.
  React.useEffect(() => {
    if (!documentId || !existing) return;
    if (!title.trim()) return;
    const saved = savedDraft.current;
    if (title === saved.title && body === saved.body && docType === saved.docType) return;
    const handle = window.setTimeout(() => save(title, body), 1500);
    return () => window.clearTimeout(handle);
  }, [title, body, docType, documentId, existing, save]);

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
      onBodyChange={changeBody}
      sections={sections}
      messages={messages}
      onSave={() => save(title, body)}
      onUndo={undo}
      onRedo={redo}
      canUndo={undoStack.current.length > 0}
      canRedo={redoStack.current.length > 0}
      saving={isPending}
      lastSaved={lastSaved}
      saveError={saveError}
      docType={docType}
      onDocTypeChange={setDocType}
      docTypeLabel={DOC_TYPE_LABEL[docType] ?? docType}
    />
  );
}
