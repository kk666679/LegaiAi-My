import { Gavel } from "lucide-react";
import { Boxes } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import type { AnalyzedDocument } from "@/lib/lawmate/document-analysis";

interface ProvenanceStripProps {
  analysis: AnalyzedDocument;
}

export function ProvenanceStrip({ analysis }: ProvenanceStripProps) {
  const p = analysis.provenance;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 rounded-md border bg-muted/40 p-2.5 text-[11px] text-muted-foreground">
      <span className="flex items-center gap-1.5">
        <Gavel className="size-3.5" />
        <span className="font-medium text-foreground">Provenance</span>
      </span>
      <span>Source: {p.source}</span>
      <span>Method: {p.method}</span>
      <span className="flex items-center gap-1">
        <Boxes className="size-3.5" />
        HITL L{p.hitlLevel} ({p.hitlLabel})
      </span>
      <span>Confidence {Math.round(p.confidence * 100)}%</span>
      <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="size-3.5" /> {p.note}
      </span>
    </div>
  );
}
