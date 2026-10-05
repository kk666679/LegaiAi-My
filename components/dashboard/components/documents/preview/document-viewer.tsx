// components/documents/preview/document-viewer.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface DocumentViewerProps {
  src?: string;
  mimeType?: string;
  page?: number;
  zoom?: number;
  className?: string;
  emptyMessage?: string;
}

export function DocumentViewer({
  src,
  mimeType,
  page = 1,
  zoom = 1,
  className,
  emptyMessage = "No preview available",
}: DocumentViewerProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "flex h-full items-center justify-center rounded-md bg-muted/30 text-sm text-muted-foreground",
          className,
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <div className={cn("h-full w-full overflow-auto bg-muted/20", className)}>
        <iframe
          title="Document preview"
          src={`${src}#page=${page}&zoom=${Math.round(zoom * 100)}`}
          className="size-full"
        />
      </div>
    );
  }

  if (mimeType?.startsWith("image/")) {
    return (
      <div className={cn("flex h-full items-center justify-center bg-muted/20 p-4", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt="Document page"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}
          className="max-h-full max-w-full object-contain transition-transform"
        />
      </div>
    );
  }

  return (
    <iframe
      title="Document preview"
      src={src}
      className={cn("size-full rounded-md border border-border/60", className)}
    />
  );
}
