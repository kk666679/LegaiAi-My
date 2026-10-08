// components/documents/status/document-empty.tsx
"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DocumentEmptyProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
}

export function DocumentEmpty({
  title = "No documents yet",
  description = "Create a document with AI or upload an existing legal document to get started.",
  icon,
  primaryAction,
  secondaryAction,
  className,
}: DocumentEmptyProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border/70 bg-muted/20 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        {icon ?? <FileText className="size-6" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {primaryAction ? (
            <Button onClick={primaryAction.onClick}>{primaryAction.label}</Button>
          ) : null}
          {secondaryAction ? (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
