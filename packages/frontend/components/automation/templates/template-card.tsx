// components/automation/templates/template-card.tsx
"use client";

import * as React from "react";
import { ArrowRight, FileJson } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { WorkflowTemplate } from "../types";

export interface TemplateCardProps {
  template: WorkflowTemplate;
  onUse?: (template: WorkflowTemplate) => void;
}

export function TemplateCard({ template, onUse }: TemplateCardProps) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onUse?.(template)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onUse?.(template);
        }
      }}
      className="flex cursor-pointer flex-col gap-2 p-3 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-2">
        <span className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
          <FileJson className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{template.name}</p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{template.description}</p>
        </div>
        <ArrowRight className="size-4 shrink-0 text-muted-foreground" />
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge variant="secondary" className="text-[10px]">
          {template.category}
        </Badge>
        {template.tags?.map((t) => (
          <Badge key={t} variant="outline" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
