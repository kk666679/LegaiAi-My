"use client";
import * as React from "react";
import { CitationReference } from "./citation-reference";

export interface Citation { id: string; title: string; href?: string; }
export function CitationList({ citations }: { citations: Citation[] }) {
  return (
    <ol className="space-y-1.5">
      {citations.map((c, i) => <li key={c.id}><CitationReference index={i + 1} title={c.title} href={c.href} /></li>)}
    </ol>
  );
}
