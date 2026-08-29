"use client";

import {
  CalendarClock,
  Bot,
  FileSearch,
  ScrollText,
  Activity,
  PenLine,
} from "lucide-react";
import { useReveal } from "./use-reveal";

/* ---------- Mini visuals ---------- */

function TimelineVisual() {
  const rows = [
    { d: "AUG 12", t: "AI Governance", j: "MY", impact: "High" },
    { d: "SEP 04", t: "Cyber Requirement", j: "SG", impact: "Med" },
    { d: "OCT 21", t: "ESG Disclosure", j: "ASEAN", impact: "High" },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div
          key={r.d}
          className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/40 px-3 py-2"
        >
          <span className="font-mono text-[10px] font-medium text-[hsl(var(--brand-cyan))]">{r.d}</span>
          <span className="flex-1 truncate text-xs text-foreground">{r.t}</span>
          <span className="rounded bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground">{r.j}</span>
          <span
            className={`text-[10px] font-semibold ${
              r.impact === "High" ? "text-rose-300" : "text-amber-300"
            }`}
          >
            {r.impact}
          </span>
        </div>
      ))}
    </div>
  );
}

function AgentsVisual() {
  return (
    <div className="grid grid-cols-3 gap-2">
      {["Research", "Draft", "Review"].map((a, i) => (
        <div
          key={a}
          className="rounded-lg border border-border/60 bg-background/40 p-2.5 text-center"
        >
          <span
            className={`mx-auto mb-1.5 block size-2 rounded-full ${
              i === 1 ? "bg-amber-300 animate-soft-pulse" : "bg-[hsl(var(--brand-cyan))]"
            }`}
          />
          <span className="text-[11px] text-muted-foreground">{a}</span>
        </div>
      ))}
    </div>
  );
}

function DocVisual() {
  return (
    <div className="space-y-1.5 rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="h-2 w-3/4 rounded bg-muted" />
      <div className="h-2 w-full rounded bg-[hsl(var(--brand-blue)/0.4)]" />
      <div className="h-2 w-5/6 rounded bg-muted" />
      <div className="h-2 w-2/3 rounded bg-[hsl(var(--brand-indigo)/0.45)]" />
      <div className="h-2 w-4/5 rounded bg-muted" />
    </div>
  );
}

function ResearchVisual() {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-background/40 px-3 py-2">
        <FileSearch className="size-3.5 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
        <span className="text-xs text-muted-foreground">Statutory basis for…</span>
      </div>
      {["§14(2) Companies Act", "Re Duomatic [1969]"].map((c) => (
        <div key={c} className="flex items-center gap-2 pl-2">
          <span className="size-1 rounded-full bg-[hsl(var(--brand-blue))]" />
          <span className="text-[11px] text-foreground">{c}</span>
        </div>
      ))}
    </div>
  );
}

function ComplianceVisual() {
  return (
    <div className="flex items-center gap-4">
      <div className="relative size-16 shrink-0">
        <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
          <circle cx="18" cy="18" r="15" fill="none" stroke="hsl(var(--border))" strokeWidth="3" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="hsl(var(--brand-cyan))"
            strokeWidth="3"
            strokeDasharray="94"
            strokeDashoffset="16"
            strokeLinecap="round"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
          83%
        </span>
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>124 obligations</p>
        <p className="text-emerald-300">103 on track</p>
        <p className="text-amber-300">21 in review</p>
      </div>
    </div>
  );
}

function DraftingVisual() {
  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-3">
      <div className="space-y-1.5">
        <div className="h-2 w-2/3 rounded bg-muted" />
        <div className="h-2 w-full rounded bg-muted" />
      </div>
      <div className="mt-2 rounded-md border border-[hsl(var(--brand-blue)/0.4)] bg-[hsl(var(--brand-blue)/0.1)] px-2 py-1.5">
        <span className="text-[10px] font-medium text-[hsl(var(--brand-cyan))]">
          AI suggestion · indemnity clause
        </span>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: CalendarClock,
    title: "Regulatory Timeline",
    desc: "Stay ahead of changes across ESG, cyber, AI and more.",
    visual: <TimelineVisual />,
    span: "lg:col-span-2",
  },
  {
    icon: Bot,
    title: "AI Agents",
    desc: "Autonomous research, drafting and compliance checks.",
    visual: <AgentsVisual />,
    span: "",
  },
  {
    icon: FileSearch,
    title: "Document Intelligence",
    desc: "Understand contracts and legal documents in seconds.",
    visual: <DocVisual />,
    span: "",
  },
  {
    icon: ScrollText,
    title: "Legal Research",
    desc: "Research legislation, regulations and case law with source-backed answers.",
    visual: <ResearchVisual />,
    span: "",
  },
  {
    icon: Activity,
    title: "Compliance Monitoring",
    desc: "Continuously monitor obligations across jurisdictions.",
    visual: <ComplianceVisual />,
    span: "",
  },
  {
    icon: PenLine,
    title: "Automated Drafting",
    desc: "Generate first drafts grounded in your organisation's legal context.",
    visual: <DraftingVisual />,
    span: "lg:col-span-2",
  },
];

export function FeatureBento() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="platform" ref={ref} className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything a modern legal team needs.
          </h2>
          <p className="reveal mt-4 text-pretty text-base leading-relaxed text-muted-foreground" style={{ transitionDelay: "80ms" }}>
            Specialised AI agents handle the operational workload so your legal team can focus on
            judgment, strategy and outcomes.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <article
                key={f.title}
                className={`reveal surface-glass surface-glass-hover group flex flex-col rounded-2xl p-6 ${f.span}`}
                style={{ transitionDelay: `${(i % 3) * 70}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-muted/70 text-[hsl(var(--brand-cyan))] transition-colors group-hover:bg-[hsl(var(--brand-blue)/0.18)]">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <h3 className="font-heading text-lg font-semibold text-foreground">{f.title}</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                <div className="mt-5 flex-1">{f.visual}</div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
