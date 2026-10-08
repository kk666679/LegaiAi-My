"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { LegalDocument } from "../types";
import { DocumentMetadata } from "../metadata/document-metadata";

export interface DocumentContextPanelProps { document: LegalDocument; sections?: Array<{ title: string; content: React.ReactNode }>; className?: string; }

export function DocumentContextPanel({ document, sections = [], className }: DocumentContextPanelProps) {
  return (
    <div className={className}>
      <Card><div className="p-3"><DocumentMetadata document={document} /></div></Card>
      {sections.map((s, i) => <Card key={i} className="mt-3"><div className="p-3"><p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{s.title}</p>{s.content}</div></Card>)}
    </div>
  );
}
