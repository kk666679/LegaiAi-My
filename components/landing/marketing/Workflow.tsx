"use client";

import { MessageSquare, Cpu, Eye, CheckCircle2 } from "lucide-react";
import { useReveal } from "./use-reveal";

const STEPS = [
  { n: "01", icon: MessageSquare, title: "Ask", desc: "Describe the legal task in plain language." },
  { n: "02", icon: Cpu, title: "Agents work", desc: "Specialised agents research, analyse and draft." },
  { n: "03", icon: Eye, title: "Review", desc: "Lawyers review sources, reasoning and outputs." },
  { n: "04", icon: CheckCircle2, title: "Act", desc: "Turn insights into compliant legal work." },
];

export function Workflow() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section ref={ref} className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From request to reviewed work product.
          </h2>
          <p className="reveal mt-4 text-pretty text-base leading-relaxed text-muted-foreground" style={{ transitionDelay: "80ms" }}>
            A simple, transparent workflow that keeps lawyers in control at every step.
          </p>
        </div>

        <div className="relative mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* connecting line on desktop */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 right-0 top-[2.4rem] hidden h-px bg-gradient-to-r from-transparent via-[hsl(var(--brand-blue)/0.5)] to-transparent lg:block"
          />
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.n}
                className="reveal relative flex flex-col items-start"
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="relative z-10 flex size-[4.75rem] items-center justify-center rounded-2xl border border-border/70 bg-card/70 backdrop-blur">
                  <Icon className="size-6 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
                  <span className="absolute -right-2 -top-2 rounded-full bg-gradient-to-br from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] px-2 py-0.5 font-mono text-[10px] font-bold text-primary-foreground">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-5 font-heading text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
