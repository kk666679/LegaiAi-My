// components/documents/status/document-not-found.tsx
"use client";

import * as React from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DocumentNotFoundProps {
  onBack?: () => void;
}

export function DocumentNotFound({ onBack }: DocumentNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <FileQuestion className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Document not found</h3>
        <p className="text-sm text-muted-foreground">
          The document you're looking for doesn't exist or you may not have access.
        </p>
      </div>
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          Back to documents
        </Button>
      ) : null}
    </div>
  );
}
