"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { DocumentTemplate } from "../types";

export function TemplatePreview({ template }: { template: DocumentTemplate }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-medium">{template.name}</p>
      {template.description ? <p className="mt-1 text-xs text-muted-foreground">{template.description}</p> : null}
      {template.jurisdiction ? <p className="mt-2 text-xs text-muted-foreground">Jurisdiction: {template.jurisdiction}</p> : null}
      {template.previewUrl ? <img src={template.previewUrl} alt="" className="mt-3 w-full rounded border border-border/60" /> : <div className="mt-3 aspect-[3/4] rounded border border-dashed border-border/60 bg-muted/20" />}
    </Card>
  );
}
