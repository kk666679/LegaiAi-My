// components/documents/upload/upload-queue.tsx
"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export interface UploadItem {
  id: string;
  fileName: string;
  size?: number;
  progress: number;
  status: "queued" | "uploading" | "processing" | "ready" | "failed";
  error?: string;
}

export interface UploadQueueProps {
  items: UploadItem[];
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  className?: string;
}

export function UploadQueue({
  items,
  onRemove,
  onRetry,
  className,
}: UploadQueueProps) {
  if (!items.length) return null;
  return (
    <ul className={cn("space-y-2", className)}>
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-start gap-3 rounded-md border border-border/60 bg-card p-3"
          aria-live="polite"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{item.fileName}</p>
            {item.status === "failed" && item.error ? (
              <p className="text-xs text-destructive">{item.error}</p>
            ) : (
              <p className="text-xs text-muted-foreground capitalize">{item.status}</p>
            )}
            {item.status === "uploading" || item.status === "processing" ? (
              <Progress value={item.progress} className="mt-2 h-1" />
            ) : null}
          </div>
          {item.status === "failed" && onRetry ? (
            <Button size="sm" variant="ghost" onClick={() => onRetry(item.id)}>
              Retry
            </Button>
          ) : null}
          {onRemove ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label={`Remove ${item.fileName}`}
              onClick={() => onRemove(item.id)}
            >
              <X className="size-4" />
            </Button>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
