"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FilePlus2, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DOC_COURTS,
  DOC_STATUSES,
  DOC_TYPES,
  type DocumentType,
  useDocumentMutations,
  type ClientSummary,
} from "@/hooks/useDocuments";

const NONE = "none";

interface NewDocumentDialogProps {
  clients?: ClientSummary[];
  defaultClientId?: string;
  trigger?: React.ReactNode;
  onCreated?: (id: string) => void;
}

/**
 * Creates a real `legal_documents` row through the documents router.
 * Content is required by the backend schema, so a short body must be
 * supplied — an empty document would be rejected server-side.
 */
export function NewDocumentDialog({
  clients = [],
  defaultClientId,
  trigger,
  onCreated,
}: NewDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [docType, setDocType] = useState<DocumentType>("MEMORANDUM");
  const [status, setStatus] = useState<string>("draft");
  const [clientId, setClientId] = useState(defaultClientId ?? NONE);
  const [caseNumber, setCaseNumber] = useState("");
  const [court, setCourt] = useState<string>(NONE);
  const [tags, setTags] = useState("");
  const { create, isPending } = useDocumentMutations();

  const reset = () => {
    setTitle("");
    setContent("");
    setDocType("MEMORANDUM");
    setStatus("draft");
    setClientId(defaultClientId ?? NONE);
    setCaseNumber("");
    setCourt(NONE);
    setTags("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Title and content are required.");
      return;
    }

    try {
      const created = await create({
        title: title.trim(),
        content,
        docType,
        status: status as (typeof DOC_STATUSES)[number]["value"],
        ...(clientId !== NONE ? { clientId } : {}),
        ...(caseNumber.trim() ? { caseNumber: caseNumber.trim() } : {}),
        ...(court !== NONE
          ? { court: court as (typeof DOC_COURTS)[number]["value"] }
          : {}),
        ...(tags.trim()
          ? { tags: tags.split(",").map((t) => t.trim()).filter(Boolean) }
          : {}),
      });

      toast.success("Document created", { description: title.trim() });
      reset();
      setOpen(false);
      const id = (created as { id?: string } | undefined)?.id;
      if (id) onCreated?.(id);
    } catch (err) {
      toast.error("Could not create document", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <FilePlus2 className="size-4" /> New document
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New document</DialogTitle>
          <DialogDescription>
            Creates a document in your workspace. Anything you generate with AI
            stays a draft until a human approves it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">Title</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Statement of Claim — Lim Wei Jian"
              required
              maxLength={500}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-type">Document type</Label>
              <Select value={docType} onValueChange={(v) => setDocType(v as DocumentType)}>
                <SelectTrigger id="doc-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-status">Initial status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="doc-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOC_STATUSES.filter((s) => s.value !== "approved").map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="doc-client">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger id="doc-client">
                  <SelectValue placeholder="No client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="doc-court">Court</Label>
              <Select value={court} onValueChange={setCourt}>
                <SelectTrigger id="doc-court">
                  <SelectValue placeholder="Not applicable" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Not applicable</SelectItem>
                  {DOC_COURTS.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-case">Case number</Label>
            <Input
              id="doc-case"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
              placeholder="e.g. WA-2026-001234"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-tags">Tags</Label>
            <Input
              id="doc-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma, separated, tags"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="doc-content">Content</Label>
            <Textarea
              id="doc-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste or type the document body…"
              rows={6}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Content is stored verbatim and is what retrieval and analysis read.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending && <Loader2 className="size-4 animate-spin" />}
              Create document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
