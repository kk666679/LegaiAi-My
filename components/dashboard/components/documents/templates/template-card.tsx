// components/documents/templates/template-card.tsx
"use client";

import * as React from "react";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DocumentTemplate } from "../types";

export interface TemplateCardProps {
  template: DocumentTemplate;
  onUse?: (template: DocumentTemplate) => void;
  onPreview?: (template: DocumentTemplate) => void;
}

export function TemplateCard({ template, onUse, onPreview }: TemplateCardProps) {
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <FileText className="size-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{template.name}</p>
          <p className="text-xs text-muted-foreground">{template.category}</p>
        </div>
      </div>
      {template.description ? (
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {template.description}
        </p>
      ) : null}
      <div className="mt-auto flex items-center gap-2">
        {onPreview ? (
          <Button size="sm" variant="outline" onClick={() => onPreview(template)}>
            Preview
          </Button>
        ) : null}
        <Button size="sm" onClick={() => onUse?.(template)}>
          Use template
        </Button>
      </div>
    </Card>
  );
}
