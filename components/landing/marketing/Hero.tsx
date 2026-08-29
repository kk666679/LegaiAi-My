"use client";

import { ArrowRight, Play, Sparkles } from "lucide-react";
import { AgentNetwork } from "./AgentNetwork";
import { useReveal } from "./use-reveal";
import { BRAND } from "@/lib/brand";

const TRUST = ["Enterprise-ready", "Secure by design", "Human-in-the-loop", "Audit-ready"];

export function Hero() {
  const ref = useReveal<HTMLElement>();

  return (
    <section
      id="top"
      ref={ref}
      className="relative overflow-hidden px-4 pb-16 pt-28 sm:px-6 lg:px-10 lg:pb-24 lg:pt-36"
    >
      {/* background layers */}
      <div aria-hidden="true" className="absolute inset-0 -z-20 glow-radial" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-grid-faint" />

      <div className="mx-auto grid max-w-[1400px] items-center gap-14 lg:grid-cols-[1.05fr_1fr]">
        {/* Left copy */}
        <div className="max-w-2xl">
          <span className="reveal inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
            Autonomous legal agents · Built for 2026
          </span>

          <h1
            className="reveal mt-6 font-heading text-[2.75rem] font-extrabold leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-[5rem]"
            style={{ transitionDelay: "80ms" }}
          >
            {BRAND.tagline}
            <br />
            for the <span className="text-gradient-brand">legal team.</span>
          </h1>

          <p
            className="reveal mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
            style={{ transitionDelay: "160ms" }}
          >
            {BRAND.description}
          </p>

          <div
            className="reveal mt-8 flex flex-col gap-3 sm:flex-row"
            style={{ transitionDelay: "240ms" }}
          >
            <a
              href="/request-access"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-16px_hsl(var(--brand-blue))] transition-all hover:shadow-[0_20px_50px_-14px_hsl(var(--brand-blue))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Request early access
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </a>
            <a
              href="/legalai/agent"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-muted/30 px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Play className="size-4" aria-hidden="true" />
              Watch demo
            </a>
          </div>

          <div className="reveal mt-10" style={{ transitionDelay: "320ms" }}>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Built for modern legal teams
            </p>
            <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST.map((item) => (
                <li key={item} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-[hsl(var(--brand-cyan))]" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right visualization */}
        <div className="reveal lg:pl-4" style={{ transitionDelay: "200ms" }}>
          <AgentNetwork />
        </div>
      </div>
    </section>
  );
}
