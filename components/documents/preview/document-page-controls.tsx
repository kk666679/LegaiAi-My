"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface DocumentPageControlsProps { page: number; pageCount?: number; onPageChange: (p: number) => void; }

export function DocumentPageControls({ page, pageCount, onPageChange }: DocumentPageControlsProps) {
  const [local, setLocal] = React.useState(String(page));
  React.useEffect(() => setLocal(String(page)), [page]);
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Page controls">
      <Button size="icon" variant="ghost" className="size-7" aria-label="Previous page" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft className="size-4" /></Button>
      <Input value={local} onChange={(e) => setLocal(e.target.value)}
        onBlur={() => { const n = Number(local); if (Number.isFinite(n) && n >= 1 && (!pageCount || n <= pageCount)) onPageChange(Math.floor(n)); else setLocal(String(page)); }}
        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); }}
        className="h-7 w-12 text-center text-xs tabular-nums" aria-label="Current page" />
      <span className="text-xs text-muted-foreground">/ {pageCount ?? "?"}</span>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Next page" disabled={pageCount ? page >= pageCount : false} onClick={() => onPageChange(page + 1)}><ChevronRight className="size-4" /></Button>
    </div>
  );
}
