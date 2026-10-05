"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { DocumentEvidence } from "../types";

export function EvidenceCard({ item, onSelect }: { item: DocumentEvidence; onSelect?: (e: DocumentEvidence) => void }) {
  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect?.(item)} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(item); }}
      className="cursor-pointer p-3 transition-colors hover:border-primary/40">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{item.section ?? ""}{item.page ? ` · Page ${item.page}` : ""}</span>
        {typeof item.confidence === "number" ? <span>{Math.round(item.confidence * 100)}%</span> : null}
      </div>
      <blockquote className="mt-1.5 border-l-2 border-primary/40 pl-2 text-sm italic">"{item.excerpt}"</blockquote>
      {item.relevance ? <p className="mt-1.5 text-xs text-muted-foreground">{item.relevance}</p> : null}
    </Card>
  );
}
