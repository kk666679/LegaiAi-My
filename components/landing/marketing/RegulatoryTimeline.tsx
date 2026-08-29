"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Category = "AI" | "Cyber" | "ESG" | "Employment" | "Privacy";

const FILTERS: Array<"All" | Category> = ["All", "AI", "Cyber", "ESG", "Employment", "Privacy"];

const EVENTS: Array<{
  date: string;
  title: string;
  jurisdiction: string;
  impact: "High" | "Medium" | "Low";
  category: Category;
}> = [
  { date: "AUG 12", title: "AI Governance Regulation", jurisdiction: "Malaysia", impact: "High", category: "AI" },
  { date: "SEP 04", title: "Cybersecurity Requirement", jurisdiction: "Singapore", impact: "Medium", category: "Cyber" },
  { date: "OCT 21", title: "ESG Disclosure Update", jurisdiction: "ASEAN", impact: "High", category: "ESG" },
  { date: "NOV 09", title: "Remote Work Directive", jurisdiction: "EU", impact: "Low", category: "Employment" },
  { date: "DEC 02", title: "Cross-border Data Transfer", jurisdiction: "UK", impact: "Medium", category: "Privacy" },
];

const IMPACT_STYLES = {
  High: "bg-rose-400/15 text-rose-300",
  Medium: "bg-amber-400/15 text-amber-300",
  Low: "bg-emerald-400/15 text-emerald-300",
} as const;

export function RegulatoryTimeline() {
  const [filter, setFilter] = useState<"All" | Category>("All");
  const visible = EVENTS.filter((e) => filter === "All" || e.category === filter);

  return (
    <section id="resources" className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1000px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Never miss a regulatory change.
          </h2>
          <p className="mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Track upcoming obligations across jurisdictions and domains — filtered to what matters
            to your teams.
          </p>
        </div>

        {/* Filters */}
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              aria-pressed={filter === f}
              className={cn(
                "rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filter === f
                  ? "border-[hsl(var(--brand-blue)/0.5)] bg-[hsl(var(--brand-blue)/0.15)] text-foreground"
                  : "border-border/70 text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <ol className="relative mt-12 space-y-4 border-l border-border/60 pl-6">
          {visible.map((e) => (
            <li key={e.title} className="relative">
              <span
                className="absolute -left-[1.6rem] top-2 size-3 rounded-full border-2 border-background bg-[hsl(var(--brand-cyan))]"
                aria-hidden="true"
              />
              <div className="surface-glass surface-glass-hover flex flex-col gap-2 rounded-2xl p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs font-semibold text-[hsl(var(--brand-cyan))]">{e.date}</span>
                  <div>
                    <p className="font-heading text-sm font-semibold text-foreground">{e.title}</p>
                    <p className="text-xs text-muted-foreground">{e.jurisdiction}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-8 sm:pl-0">
                  <span className="rounded-full bg-muted/70 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    {e.category}
                  </span>
                  <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-medium", IMPACT_STYLES[e.impact])}>
                    Impact: {e.impact}
                  </span>
                </div>
              </div>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="py-6 text-center text-sm text-muted-foreground">No changes in this category.</li>
          )}
        </ol>
      </div>
    </section>
  );
}
