"use client";
import * as React from "react";
import type { DocumentEvidence } from "../types";
import { Card } from "@/components/ui/card";

export interface EvidenceViewerProps { item?: DocumentEvidence; onJumpToPage?: (page: number) => void; }

export function EvidenceViewer({ item, onJumpToPage }: EvidenceViewerProps) {
  if (!item) return <p className="p-4 text-sm text-muted-foreground">Select evidence to view.</p>;
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{item.section ?? ""}{item.page ? ` · Page ${item.page}` : ""}</span>
        {item.page && onJumpToPage ? <button type="button" onClick={() => onJumpToPage(item.page!)} className="text-primary hover:underline">Jump to page</button> : null}
      </div>
      <blockquote className="mt-3 border-l-2 border-primary/40 pl-3 text-sm italic">"{item.excerpt}"</blockquote>
      {item.relevance ? <p className="mt-2 text-xs text-muted-foreground">{item.relevance}</p> : null}
    </Card>
  );
}
