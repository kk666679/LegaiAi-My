// components/documents/metadata/document-tags.tsx
"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { DocumentTag } from "../types";

export interface DocumentTagsProps {
  tags: DocumentTag[];
  editable?: boolean;
  onAdd?: (label: string) => void;
  onRemove?: (id: string) => void;
}

export function DocumentTags({
  tags,
  editable,
  onAdd,
  onRemove,
}: DocumentTagsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <Badge key={tag.id} variant="secondary" className="gap-1 pr-1 text-xs">
          {tag.label}
          {editable && onRemove ? (
            <button
              type="button"
              aria-label={`Remove tag ${tag.label}`}
              className="rounded-sm p-0.5 hover:bg-background/60"
              onClick={() => onRemove(tag.id)}
            >
              <X className="size-3" />
            </button>
          ) : null}
        </Badge>
      ))}
      {editable && onAdd ? (
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-6 gap-1 px-2 text-xs"
          onClick={() => {
            const label = window.prompt("Add tag");
            if (label?.trim()) onAdd(label.trim());
          }}
        >
          <Plus className="size-3" /> Add
        </Button>
      ) : null}
    </div>
  );
}
