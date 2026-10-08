"use client";

import { useEffect, useState } from "react";
import { Radar, Search, FileText, ShieldCheck, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "Active" | "Processing" | "Complete";

const STATUS_STYLES: Record<Status, string> = {
  Active: "bg-[hsl(var(--brand-cyan)/0.15)] text-[hsl(var(--brand-cyan))]",
  Processing: "bg-amber-400/15 text-amber-300",
  Complete: "bg-emerald-400/15 text-emerald-300",
};

const AGENTS = [
  {
    icon: Radar,
    name: "Regulatory Agent",
    detail: "Monitoring 28 jurisdictions",
    status: "Active" as Status,
  },
  {
    icon: Search,
    name: "Research Agent",
    detail: "Analyzing 142 sources",
    status: "Processing" as Status,
  },
  {
    icon: FileText,
    name: "Drafting Agent",
    detail: "Preparing agreement",
    status: "Complete" as Status,
  },
  {
    icon: ShieldCheck,
    name: "Compliance Agent",
    detail: "37 obligations tracked",
    status: "Active" as Status,
  },
];

export function AgentNetwork() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((v) => (v + 1) % AGENTS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-xl">
      {/* ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-[radial-gradient(circle_at_50%_30%,hsl(var(--brand-blue)/0.22),transparent_65%)] blur-2xl"
      />

      {/* Core node */}
      <div className="mb-8 flex justify-center">
        <div className="surface-glass animate-floaty flex items-center gap-3 rounded-2xl px-5 py-3.5 shadow-[0_20px_60px_-30px_hsl(var(--brand-blue))]">
          <span className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-indigo))]">
            <Cpu className="size-5 text-background" aria-hidden="true" />
          </span>
          <div>
            <p className="font-heading text-sm font-bold text-foreground">Legal AI Core</p>
            <p className="text-xs text-muted-foreground">Orchestrating 4 agents</p>
          </div>
        </div>
      </div>

      {/* Connection lines */}
      <svg
        className="pointer-events-none absolute left-1/2 top-[68px] -z-0 h-16 w-[70%] -translate-x-1/2"
        viewBox="0 0 300 60"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        {[40, 113, 187, 260].map((x, i) => (
          <path
            key={x}
            d={`M150 2 C150 30, ${x} 20, ${x} 58`}
            stroke={i === active ? "hsl(var(--brand-cyan))" : "hsl(var(--border))"}
            strokeWidth="1.5"
            className={i === active ? "animate-dash" : undefined}
            opacity={i === active ? 0.9 : 0.4}
          />
        ))}
      </svg>

      {/* Agent cards */}
      <ul className="relative grid grid-cols-2 gap-3 sm:gap-4">
        {AGENTS.map((agent, i) => {
          const Icon = agent.icon;
          const isActive = i === active;
          return (
            <li
              key={agent.name}
              className={cn(
                "surface-glass rounded-2xl p-4 transition-all duration-500",
                isActive
                  ? "border-[hsl(var(--brand-blue)/0.55)] shadow-[0_18px_50px_-28px_hsl(var(--brand-blue))]"
                  : "opacity-90"
              )}
            >
              <div className="flex items-center justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-muted/70 text-[hsl(var(--brand-cyan))]">
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <span
                  className={cn(
                    "size-2 rounded-full",
                    isActive && "animate-soft-pulse",
                    agent.status === "Active" && "bg-[hsl(var(--brand-cyan))]",
                    agent.status === "Processing" && "bg-amber-300",
                    agent.status === "Complete" && "bg-emerald-300"
                  )}
                  aria-hidden="true"
                />
              </div>
              <p className="mt-3 font-heading text-sm font-semibold text-foreground">{agent.name}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{agent.detail}</p>
              <span
                className={cn(
                  "mt-3 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  STATUS_STYLES[agent.status]
                )}
              >
                {agent.status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
