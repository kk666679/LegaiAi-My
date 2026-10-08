// components/documents/evidence/evidence-list.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import type { DocumentEvidence } from "../types";

export interface EvidenceListProps {
  items: DocumentEvidence[];
  onSelect?: (evidence: DocumentEvidence) => void;
}

export function EvidenceList({ items, onSelect }: EvidenceListProps) {
  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Evidence will appear here once an analysis has run.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((e) => (
        <li key={e.id}>
          <Card
            role="button"
            tabIndex={0}
            className="cursor-pointer p-3 transition-colors hover:border-primary/40"
            onClick={() => onSelect?.(e)}
          >
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {e.section ? `${e.section}` : ""}
                {e.page ? ` · Page ${e.page}` : ""}
              </span>
              {typeof e.confidence === "number" ? (
                <span>{Math.round(e.confidence * 100)}%</span>
              ) : null}
            </div>
            <blockquote className="mt-1.5 border-l-2 border-primary/40 pl-2 text-sm italic">
              "{e.excerpt}"
            </blockquote>
            {e.relevance ? (
              <p className="mt-1.5 text-xs text-muted-foreground">{e.relevance}</p>
            ) : null}
          </Card>
        </li>
      ))}
    </ul>
  );
}
