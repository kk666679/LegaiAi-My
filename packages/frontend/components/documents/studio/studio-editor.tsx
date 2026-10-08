"use client";

import { FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export function StudioEditor({
  value,
  onChange,
  title,
  subtitle,
  status,
}: {
  value: string;
  onChange: (value: string) => void;
  title: string;
  subtitle?: string;
  status: string;
}) {
  return (
    <section className="mx-auto w-full max-w-4xl space-y-5">
      <header className="rounded-xl border border-border/70 bg-card p-5 shadow-sm sm:p-7">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <FileText className="size-4 text-primary" />
            <span>{subtitle ?? status}</span>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{status}</span>
        </div>
        <h1 className="mb-5 text-2xl font-semibold tracking-tight sm:text-3xl">{title || "Untitled document"}</h1>
        <div className="flex items-center gap-2 border-t border-border/60 pt-4 text-xs text-muted-foreground">
          <FileText className="size-3.5" />
          <span>Working draft</span>
          <span aria-hidden="true">·</span>
          <span>{value.trim() ? `${value.trim().split(/\s+/).length} words` : "Start writing your document"}</span>
        </div>
      </header>
      <Textarea
        aria-label="Document body"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder="Begin drafting here…\n\nAdd your key terms, parties, relevant facts, and provisions. Keep source material close and review every legal authority before relying on it."
        className="min-h-[55dvh] resize-y rounded-xl border-border/70 bg-card px-6 py-6 font-serif text-[15px] leading-8 shadow-sm placeholder:font-sans placeholder:text-sm placeholder:leading-6 sm:min-h-[calc(100dvh-17rem)] sm:px-10 sm:py-9"
      />
    </section>
  );
}
