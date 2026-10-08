"use client";

import Link from "next/link";
import { ArrowRight, Play, LayoutDashboard, Sparkles, BookOpen } from "lucide-react";
import { useReveal } from "./use-reveal";

const PATHS = [
  {
    href: "/lawmate",
    icon: LayoutDashboard,
    label: "Open Workspace",
    desc: "Matters, deadlines and approvals in one view.",
  },
  {
    href: "/lawmate/draft",
    icon: Sparkles,
    label: "Open Drafting Studio",
    desc: "Draft from a template with citations attached.",
  },
  {
    href: "/lawmate/research",
    icon: BookOpen,
    label: "Research Malaysian law",
    desc: "Source-backed answers from the LOM catalogue.",
  },
];

export function FinalCTA() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="access" ref={ref} className="relative overflow-hidden px-4 py-28 sm:px-6 lg:px-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[900px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--brand-blue)/0.25),transparent_60%)] blur-3xl"
      />
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="reveal text-balance font-heading text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
          Let your legal team focus on the work that matters.
        </h2>
        <p className="reveal mx-auto mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground" style={{ transitionDelay: "80ms" }}>
          Automate the operational workload. Keep lawyers in control.
        </p>

        <div className="reveal mt-9 grid gap-3 sm:grid-cols-3" style={{ transitionDelay: "140ms" }}>
          {PATHS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.href}
                href={p.href}
                className="surface-glass surface-glass-hover group flex flex-col items-start rounded-2xl p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted/70 text-[hsl(var(--brand-cyan))]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="mt-3 text-sm font-semibold text-foreground">{p.label}</span>
                <span className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {p.desc}
                </span>
                <ArrowRight
                  className="mt-3 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            );
          })}
        </div>

        <div className="reveal mt-6 flex flex-col justify-center gap-3 sm:flex-row" style={{ transitionDelay: "200ms" }}>
          <a
            href="/request-access"
            className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-16px_hsl(var(--brand-blue))] transition-all hover:shadow-[0_20px_50px_-14px_hsl(var(--brand-blue))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Request early access
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </a>
          <a
            href="/lawmate/assistant"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 px-7 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Play className="size-4" aria-hidden="true" />
            Watch demo
          </a>
        </div>
      </div>
    </section>
  );
}