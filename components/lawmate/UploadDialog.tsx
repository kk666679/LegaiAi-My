"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatBytes } from "@/lib/lawmate/utils";
import type { Document } from "@/types/lawmate";

interface UploadFile {
  id: string;
  file: File;
  progress: number;
  status: "uploading" | "processing" | "ready" | "failed";
  error?: string;
}

interface UploadDialogProps {
  trigger?: React.ReactNode;
  onUploaded?: (doc: Document) => void;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

const ACTIONS = [
  { id: "analyse", label: "Analyse", icon: Sparkles },
  { id: "summarise", label: "Summarise", icon: FileText },
  { id: "risks", label: "Find Risks", icon: AlertCircle },
  { id: "clauses", label: "Extract Clauses", icon: FileText },
  { id: "compare", label: "Compare", icon: FileText },
  { id: "ask", label: "Ask LawMate", icon: FileText },
  { id: "draft", label: "Draft Response", icon: FileText },
];

const ACCEPTED = ".pdf,.docx,.txt,.rtf,.odt";

export function UploadDialog({ trigger, onUploaded, open: controlledOpen, onOpenChange: controlledOnOpenChange }: UploadDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (controlledOnOpenChange) controlledOnOpenChange(v);
    else setInternalOpen(v);
  };
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [dragOver, setDragOver] = useState(false);

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const newFiles: UploadFile[] = Array.from(list).map((f) => ({
      id: `up-${Date.now()}-${Math.random()}`,
      file: f,
      progress: 0,
      status: "uploading" as const,
    }));
    setFiles((cur) => [...cur, ...newFiles]);

    newFiles.forEach((uf) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/blob/upload");

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          setFiles((cur) =>
            cur.map((x) => (x.id === uf.id ? { ...x, progress: pct, status: "uploading" } : x)),
          );
        }
      });

      xhr.addEventListener("load", async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const blob = JSON.parse(xhr.responseText) as { pathname?: string; size?: number; contentType?: string };
            setFiles((cur) => cur.map((x) => (x.id === uf.id ? { ...x, progress: 100, status: "ready" } : x)));
            const doc: Document = {
              id: uf.id,
              name: uf.file.name,
              type: uf.file.type || "application/octet-stream",
              size: blob.size ?? uf.file.size,
              uploadedAt: new Date().toISOString(),
              status: "ready",
              classification: "internal",
              url: blob.pathname ? `/api/blob/file?pathname=${encodeURIComponent(blob.pathname)}` : undefined,
            };
            onUploaded?.(doc);
          } catch {
            setFiles((cur) => cur.map((x) => (x.id === uf.id ? { ...x, status: "failed", error: "Invalid response" } : x)));
          }
        } else {
          let errMsg = `Upload failed (${xhr.status})`;
          try {
            const e = JSON.parse(xhr.responseText);
            errMsg = e.error || errMsg;
          } catch {}
          setFiles((cur) => cur.map((x) => (x.id === uf.id ? { ...x, status: "failed", error: errMsg } : x)));
        }
      });

      xhr.addEventListener("error", () => {
        setFiles((cur) => cur.map((x) => (x.id === uf.id ? { ...x, status: "failed", error: "Network error" } : x)));
      });

      const fd = new FormData();
      fd.append("file", uf.file);
      xhr.send(fd);
    });
  };

  const removeFile = (id: string) =>
    setFiles((cur) => cur.filter((x) => x.id !== id));

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Upload className="size-4" /> Upload
          </Button>
        )}
      </SheetTrigger>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md flex flex-col"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Upload className="size-4 text-primary" /> Upload documents
          </SheetTitle>
          <SheetDescription>
            PDF, DOCX, TXT, RTF and ODT up to 25 MB each.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              addFiles(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors",
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/30 hover:bg-accent/40",
            )}
          >
            <input
              type="file"
              accept={ACCEPTED}
              multiple
              onChange={(e) => addFiles(e.target.files)}
              className="sr-only"
            />
            <Upload className="size-6 text-primary mb-2" />
            <p className="text-sm font-medium">Drop files here or click to browse</p>
            <p className="text-xs text-muted-foreground mt-1">
              Files are processed securely.
            </p>
          </label>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                {files.length} file{files.length === 1 ? "" : "s"}
              </p>
              {files.map((f) => (
                <div
                  key={f.id}
                  className="rounded-md border p-3 text-sm flex items-start gap-2"
                >
                  <FileText className="size-4 text-muted-foreground mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{f.file.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatBytes(f.file.size)}</span>
                      <span>·</span>
                      {f.status === "uploading" && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Loader2 className="size-3 animate-spin" /> Uploading…
                        </span>
                      )}
                      {f.status === "processing" && (
                        <span className="inline-flex items-center gap-1 text-primary">
                          <Loader2 className="size-3 animate-spin" /> Processing…
                        </span>
                      )}
                      {f.status === "ready" && (
                        <span className="inline-flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="size-3" /> Ready
                        </span>
                      )}
                      {f.status === "failed" && (
                        <span className="inline-flex items-center gap-1 text-red-500">
                          <AlertCircle className="size-3" /> {f.error ?? "Failed"}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all"
                        style={{ width: `${f.progress}%` }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(f.id)}
                    className="text-muted-foreground hover:text-foreground p-1"
                    aria-label="Remove"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {files.some((f) => f.status === "ready") && (
          <div className="border-t p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground">
              Quick actions
            </p>
            <div className="flex flex-wrap gap-2">
              {ACTIONS.map((a) => {
                const Icon = a.icon;
                return (
                  <Button
                    key={a.id}
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                  >
                    <Icon className="size-3.5" /> {a.label}
                  </Button>
                );
              })}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}