// components/documents/upload/document-upload-dialog.tsx
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DocumentDropzone } from "./document-dropzone";
import { UploadQueue, type UploadItem } from "./upload-queue";

export interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload?: (files: File[]) => void;
  items?: UploadItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  onUpload,
  items = [],
  onRemove,
  onRetry,
}: DocumentUploadDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload documents</DialogTitle>
          <DialogDescription>
            Add legal documents to your workspace for processing and AI analysis.
          </DialogDescription>
        </DialogHeader>
        <DocumentDropzone onFiles={(files) => onUpload?.(files)} />
        <UploadQueue items={items} onRemove={onRemove} onRetry={onRetry} />
      </DialogContent>
    </Dialog>
  );
}
