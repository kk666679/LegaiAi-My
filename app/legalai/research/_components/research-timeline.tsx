"use client";
// app/legalai/research/_components/research-timeline.tsx
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useResearch } from "./use-research";
import { AuthorityKindBadge } from "./authority-badges";

export function ResearchTimelinePage({ id }: { id: string }) {
  const { sessionAuthorities } = useResearch({ sessionId: id });
  const sorted = [...sessionAuthorities].sort((a, b) => a.year - b.year);

  // Group by decade
  const grouped = React.useMemo(() => {
    const map = new Map<string, typeof sorted>();
    for (const a of sorted) {
      const decade = `${Math.floor(a.year / 10) * 10}s`;
      if (!map.has(decade)) map.set(decade, []);
      map.get(decade)!.push(a);
    }
    return [...map.entries()];
  }, [sorted]);

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4">
      <header>
        <h1 className="text-lg font-semibold">Legal timeline</h1>
        <p className="text-xs text-muted-foreground">
          Authorities on this issue, ordered chronologically.
        </p>
      </header>

      <div className="relative space-y-6 pl-6">
        <span className="absolute left-2 top-0 h-full w-px bg-border" aria-hidden />
        {grouped.map(([decade, items]) => (
          <section key={decade} className="relative">
            <div className="absolute -left-5 top-1.5 grid size-5 place-items-center rounded-full border border-primary bg-background">
              <span className="size-2 rounded-full bg-primary" aria-hidden />
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {decade}
            </p>
            <div className="space-y-2">
              {items.map((a) => (
                <Card key={a.id} className="p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <AuthorityKindBadge kind={a.kind} />
                    <Badge variant="outline" className="text-[10px] tabular-nums">{a.year}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium">{a.title}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{a.citation.short}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.summary}</p>
                </Card>
              ))}
            </div>
          </section>
        ))}
        {grouped.length === 0 ? (
          <p className={cn("text-sm text-muted-foreground")}>No dated authorities in this session.</p>
        ) : null}
      </div>
    </div>
  );
}
