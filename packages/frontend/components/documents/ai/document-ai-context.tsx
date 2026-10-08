"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { LegalDocument } from "../types";

export interface DocumentAIContextValue { document?: LegalDocument; page?: number; selection?: string; clauseId?: string; }
export interface DocumentAIContextProps { value: DocumentAIContextValue; className?: string; }

export function DocumentAIContext({ value, className }: DocumentAIContextProps) {
  return (
    <Card className={className}>
      <div className="space-y-1.5 p-3 text-xs">
        <p className="font-medium uppercase tracking-wide text-muted-foreground">AI context</p>
        {value.document ? <p><span className="text-muted-foreground">Document:</span> {value.document.name}</p> : null}
        {value.page ? <p><span className="text-muted-foreground">Page:</span> {value.page}</p> : null}
        {value.clauseId ? <p><span className="text-muted-foreground">Clause:</span> {value.clauseId}</p> : null}
        {value.selection ? <p className="line-clamp-3"><span className="text-muted-foreground">Selection:</span> {value.selection}</p> : null}
      </div>
    </Card>
  );
}
