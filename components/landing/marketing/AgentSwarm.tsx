"use client";

import { Search, Radar, PenLine, ShieldCheck, User, Layers, ShieldQuestion } from "lucide-react";
import { useReveal } from "./use-reveal";

const AGENTS = [
  { icon: Search, name: "Research", color: "hsl(var(--brand-cyan))" },
  { icon: Radar, name: "Regulatory", color: "hsl(var(--brand-blue))" },
  { icon: PenLine, name: "Drafting", color: "hsl(var(--brand-indigo))" },
  { icon: ShieldCheck, name: "Compliance", color: "hsl(var(--brand-cyan))" },
];

export function AgentSwarm() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="agents" ref={ref} className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-10">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-grid-faint opacity-40" />
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One platform. A team of legal AI agents.
          </h2>
          <p className="reveal mt-4 text-pretty text-base leading-relaxed text-muted-foreground" style={{ transitionDelay: "80ms" }}>
            Instead of one generic chatbot, specialised agents collaborate — each an expert in its
            domain — then synthesise a single, reviewable legal work product.
          </p>
        </div>

        <div className="reveal mx-auto mt-16 max-w-4xl" style={{ transitionDelay: "120ms" }}>
          {/* User request */}
          <div className="flex justify-center">
            <Node icon={User} label="User request" tone="muted" />
          </div>
          <Connector />

          {/* Orchestrator */}
          <div className="flex justify-center">
            <div className="surface-glass flex items-center gap-3 rounded-2xl px-6 py-4 shadow-[0_20px_60px_-30px_hsl(var(--brand-blue))]">
              <span className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-indigo))]">
                <Layers className="size-5 text-background" aria-hidden="true" />
              </span>
              <span className="font-heading text-base font-bold text-foreground">Legal AI Orchestrator</span>
            </div>
          </div>
          <Connector />

          {/* Agents row */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {AGENTS.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.name}
                  className="surface-glass surface-glass-hover flex flex-col items-center gap-2 rounded-2xl px-3 py-5 text-center"
                >
                  <span
                    className="flex size-11 items-center justify-center rounded-xl bg-muted/70"
                    style={{ color: a.color }}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="text-sm font-semibold text-foreground">{a.name}</span>
                  <span className="text-[11px] text-muted-foreground">Agent</span>
                </div>
              );
            })}
          </div>
          <Connector />

          {/* Output */}
          <div className="flex justify-center">
            <div className="rounded-2xl border border-[hsl(var(--brand-blue)/0.4)] bg-[hsl(var(--brand-blue)/0.08)] px-6 py-4 text-center">
              <span className="font-heading text-base font-semibold text-foreground">
                Synthesised legal work product
              </span>
            </div>
          </div>

          {/* Human oversight callout */}
          <div className="mt-10 flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-card/40 px-5 py-4">
            <ShieldQuestion className="size-5 shrink-0 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
            <p className="text-sm text-muted-foreground text-pretty">
              <span className="font-semibold text-foreground">Human oversight remains at the centre.</span>{" "}
              AI assists lawyers — it never replaces legal judgment.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Node({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "muted";
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-border/60 bg-card/50 px-5 py-3">
      <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

function Connector() {
  return (
    <div className="flex justify-center py-4" aria-hidden="true">
      <svg width="2" height="40" viewBox="0 0 2 40" fill="none">
        <line
          x1="1"
          y1="0"
          x2="1"
          y2="40"
          stroke="hsl(var(--brand-blue))"
          strokeWidth="1.5"
          className="animate-dash"
          opacity="0.7"
        />
      </svg>
    </div>
  );
}
