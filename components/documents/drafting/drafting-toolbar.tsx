"use client";
import * as React from "react";
import { Download, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface DraftingToolbarProps { onGenerate?: () => void; onSave?: () => void; onExport?: () => void; busy?: boolean; canGenerate?: boolean; }

export function DraftingToolbar({ onGenerate, onSave, onExport, busy, canGenerate }: DraftingToolbarProps) {
  return (
    <div role="toolbar" aria-label="Drafting toolbar" className="flex flex-wrap items-center gap-2">
      <Button size="sm" className="gap-1.5" disabled={busy || !canGenerate} onClick={onGenerate}>
        <Sparkles className="size-3.5" /> {busy ? "Generating…" : "Generate draft"}
      </Button>
      <Separator orientation="vertical" className="h-5" />
      <Button size="sm" variant="outline" className="gap-1.5" onClick={onSave}><Save className="size-3.5" /> Save</Button>
      <Button size="sm" variant="outline" className="gap-1.5" onClick={onExport}><Download className="size-3.5" /> Export</Button>
    </div>
  );
}
