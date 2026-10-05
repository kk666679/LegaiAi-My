// components/documents/upload/document-dropzone.tsx
"use client";

import * as React from "react";
import { UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DocumentDropzoneProps {
  onFiles: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
}

export function DocumentDropzone({
  onFiles,
  accept = ".pdf,.doc,.docx,.txt,.rtf,.md",
  multiple = true,
  className,
  disabled,
}: DocumentDropzoneProps) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files?.length) return;
    onFiles(Array.from(files));
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border/70 bg-muted/10 px-6 py-10 text-center transition-colors",
        dragging && "border-primary/60 bg-primary/5",
        disabled && "pointer-events-none opacity-60",
        className,
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      role="region"
      aria-label="Document upload dropzone"
    >
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <UploadCloud className="size-6" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium">Drop files here or click to browse</p>
        <p className="text-xs text-muted-foreground">PDF, DOCX, TXT up to 50 MB each</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
      >
        Choose files
      </Button>
    </div>
  );
}
