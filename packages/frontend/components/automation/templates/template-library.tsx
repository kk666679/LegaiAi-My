// components/automation/templates/template-library.tsx
"use client";

import * as React from "react";
import type { WorkflowTemplate } from "../types";
import { TemplateCard } from "./template-card";

export interface TemplateLibraryProps {
  templates: WorkflowTemplate[];
  onUse?: (template: WorkflowTemplate) => void;
}

export function TemplateLibrary({ templates, onUse }: TemplateLibraryProps) {
  return (
    <div className="space-y-3 p-3">
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Start faster
        </p>
        <p className="mt-0.5 text-sm font-semibold">Templates</p>
      </div>
      {templates.length === 0 ? (
        <p className="text-xs text-muted-foreground">No templates yet.</p>
      ) : (
        <div className="space-y-2">
          {templates.map((t) => (
            <TemplateCard key={t.id} template={t} onUse={onUse} />
          ))}
        </div>
      )}
    </div>
  );
}
