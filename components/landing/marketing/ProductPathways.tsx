"use client";

import Link from "next/link";
import {
  ArrowRight,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  CheckCircle2,
  Gavel,
  CircleDashed,
  FileSignature,
} from "lucide-react";
import { useReveal } from "./use-reveal";
import { cn } from "@/lib/utils";

/* ---------- Mini previews (purely illustrative marketing mock) ---------- */

function WorkspacePreview() {
  const metrics = [
    { k: "Active matters", v: "38" },
    { k: "Approvals", v: "4" },
    { k: "Documents", v: "126" },
  ];
  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-3 gap-2">
        {metrics.map((m) => (
          <div
            key={m.k}
            className="rounded-lg border border-border/60 bg-background/40 px-2.5 py-2"
          >
            <p className="text-[9px] uppercase tracking-wider text-muted-foreground">
              {m.k}
            </p>
            <p className="font-heading text-lg font-bold leading-tight text-foreground">
              {m.v}
            </p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/40 p-2.5">
        {[
          { icon: Gavel, t: "TechNova v Lim — hearing in 3 days", tone: "text-amber-300" },
          { icon: CircleDashed, t: "Draft agent awaiting approval · L2", tone: "text-[hsl(var(--brand-cyan))]" },
          { icon: CheckCircle2, t: "Citation check passed · 14/14", tone: "text-emerald-300" },
        ].map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.t} className="flex items-center gap-2">
              <Icon className={cn("size-3 shrink-0", row.tone)} aria-hidden="true" />
              <span className="truncate text-[11px] text-foreground">{row.t}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DraftingPreview() {
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap gap-1.5">
        {["Warning Letter", "Show-Cause", "Legal Opinion"].map((t, i) => (
          <span
            key={t}
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              i === 0
                ? "bg-[hsl(var(--brand-blue)/0.18)] text-foreground"
                : "bg-muted/70 text-muted-foreground",
            )}
          >
            {t}
          </span>
        ))}
      </div>
      <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/40 p-3">
        <span className="block h-1.5 w-full rounded bg-muted" />
        <span className="block h-1.5 w-5/6 rounded bg-muted" />
        <span className="block h-1.5 w-4/6 rounded bg-muted" />
        <span className="mt-2 flex items-center gap-1.5 rounded-md border border-[hsl(var(--brand-cyan)/0.4)] bg-[hsl(var(--brand-cyan)/0.1)] px-2 py-1">
          <Gavel className="size-3 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
          <span className="text-[10px] font-medium text-foreground">
            Employment Act 1955 · s.14 — verified
          </span>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <span
            className="block h-full w-[86%] rounded-full bg-gradient-to-r from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-indigo))]"
            aria-hidden="true"
          />
        </span>
        <span className="font-mono text-[10px] font-semibold text-foreground">86</span>
      </div>
    </div>
  );
}

function ResearchPreview() {
  const hits = [
    { t: "Employment Act 1955", m: "Act 265" },
    { t: "Contracts Act 1950", m: "Act 136" },
    { t: "PDPA 2010", m: "Act 709" },
  ];
  return (
    <div className="space-y-2">
      {hits.map((h) => (
        <div
          key={h.t}
          className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
        >
          <CheckCircle2 className="size-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
          <span className="flex-1 truncate text-[11px] text-foreground">{h.t}</span>
          <span className="font-mono text-[10px] text-muted-foreground">{h.m}</span>
        </div>
      ))}
      <p className="text-[10px] text-muted-foreground">
        Every answer links back to the statute it came from.
      </p>
    </div>
  );
}

const PATHWAYS = [
  {
    href: "/legalai",
    icon: LayoutDashboard,
    eyebrow: "Step 1 · Workspace",
    title: "Start in the operations center",
    desc:
      "Matters, deadlines, documents, approvals and agent activity in one auditable view. Know what needs a lawyer today.",
    points: [
      "Live matter and document counts",
      "Deadline and critical-alert triage",
      "Pending AI approvals with HITL levels",
      "Immutable audit trail per action",
    ],
    visual: <WorkspacePreview />,
  },
  {
    href: "/legalai/draft",
    icon: Sparkles,
    eyebrow: "Step 2 · Drafting Studio",
    title: "Draft with evidence attached",
    desc:
      "Template-first drafting with an AI assistant, citation validation against the LOM catalogue and a transparent quality score.",
    points: [
      "11 Malaysian document templates",
      "Citation insertion + format validation",
      "Quality scoring you can inspect",
      "Version history and export",
    ],
    visual: <DraftingPreview />,
    featured: true,
  },
  {
    href: "/legalai/research",
    icon: BookOpen,
    eyebrow: "Step 3 · Research",
    title: "Verify before you rely",
    desc:
      "Search Malaysian legislation and case law, then trace every statement back to the authority that supports it.",
    points: [
      "Legislation, case law and guidelines",
      "Multi-jurisdiction filtering",
      "Source-backed answers only",
      "No fabricated authorities",
    ],
    visual: <ResearchPreview />,
  },
];

/**
 * Home → Workspace → Drafting Studio hand-off. Gives a first-time visitor an
 * explicit path into the product instead of a single undifferentiated CTA.
 */
export function ProductPathways() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section
      id="pathways"
      ref={ref}
      className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-10"
    >
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-grid-faint opacity-30" />
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="reveal text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-cyan))]">
            Three steps, one system
          </p>
          <h2 className="reveal mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            See it. Draft it. Prove it.
          </h2>
          <p className="reveal mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            The workspace shows what needs attention, the Drafting Studio produces the work, and
            research keeps every claim honest. Open any step directly.
          </p>
        </div>

        <ol className="mt-14 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {PATHWAYS.map((p, i) => {
            const Icon = p.icon;
            return (
              <li key={p.href} className="reveal" style={{ transitionDelay: `${i * 90}ms` }}>
                <Link
                  href={p.href}
                  className={cn(
                    "surface-glass surface-glass-hover group flex h-full flex-col rounded-2xl p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    p.featured && "border-[hsl(var(--brand-blue)/0.45)]",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex size-10 items-center justify-center rounded-xl bg-muted/70 text-[hsl(var(--brand-cyan))] transition-colors group-hover:bg-[hsl(var(--brand-blue)/0.18)]">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {p.featured ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--brand-blue)/0.16)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[hsl(var(--brand-cyan))]">
                        <FileSignature className="size-3" aria-hidden="true" />
                        Start here
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        0{i + 1}
                      </span>
                    )}
                  </div>

                  <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {p.eyebrow}
                  </p>
                  <h3 className="mt-1.5 font-heading text-lg font-semibold text-foreground">
                    {p.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.desc}</p>

                  <ul className="mt-4 space-y-1.5">
                    {p.points.map((point) => (
                      <li key={point} className="flex items-start gap-2 text-[13px] text-muted-foreground">
                        <CheckCircle2
                          className="mt-0.5 size-3.5 shrink-0 text-[hsl(var(--brand-cyan))]"
                          aria-hidden="true"
                        />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-5 flex-1">{p.visual}</div>

                  <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    Open {p.eyebrow.split(" · ")[1]}
                    <ArrowRight
                      className="size-4 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}