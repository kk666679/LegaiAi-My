"use client";

import {
  LayoutDashboard,
  Search,
  Radar,
  FileText,
  Activity,
  Bot,
  ListTodo,
  Settings,
  Bell,
  TrendingUp,
} from "lucide-react";
import { useReveal } from "./use-reveal";

const SIDEBAR = [
  { icon: LayoutDashboard, label: "Overview", active: true },
  { icon: Search, label: "Research" },
  { icon: Radar, label: "Regulatory" },
  { icon: FileText, label: "Documents" },
  { icon: Activity, label: "Compliance" },
  { icon: Bot, label: "Agents" },
  { icon: ListTodo, label: "Tasks" },
  { icon: Settings, label: "Settings" },
];

const ALERTS = [
  { t: "EU AI Act — high-risk classification update", tag: "Regulatory", tone: "rose" },
  { t: "Data transfer clause flagged in MSA v3", tag: "Contract", tone: "amber" },
  { t: "Quarterly ESG disclosure due in 9 days", tag: "Deadline", tone: "cyan" },
];

const AGENTS = [
  { name: "Research Agent", state: "Analyzing 142 sources", pct: 72 },
  { name: "Drafting Agent", state: "Preparing agreement", pct: 100 },
  { name: "Compliance Agent", state: "Scanning obligations", pct: 45 },
];

export function ProductDashboard() {
  const ref = useReveal<HTMLDivElement>();

  return (
    <section id="demo" ref={ref} className="px-4 py-24 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="reveal text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            An operations center for your legal team.
          </h2>
          <p className="reveal mt-4 text-pretty text-base leading-relaxed text-muted-foreground" style={{ transitionDelay: "80ms" }}>
            Matters, regulatory alerts, agent activity and compliance health — all in one calm,
            auditable workspace.
          </p>
        </div>

        <div className="reveal mt-14 overflow-hidden rounded-2xl border border-border/70 bg-card/50 shadow-[0_40px_120px_-40px_hsl(var(--brand-blue)/0.5)]" style={{ transitionDelay: "120ms" }}>
          {/* window bar */}
          <div className="flex items-center gap-2 border-b border-border/70 bg-background/60 px-4 py-3">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">app.legalai.my/overview</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
            {/* Sidebar */}
            <aside className="hidden border-r border-border/70 bg-background/40 p-3 md:block">
              <ul className="space-y-1">
                {SIDEBAR.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <span
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm ${
                          item.active
                            ? "bg-[hsl(var(--brand-blue)/0.15)] font-medium text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        <Icon className="size-4" aria-hidden="true" />
                        {item.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </aside>

            {/* Main */}
            <div className="p-4 sm:p-6">
              {/* stat row */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  { k: "Active matters", v: "38" },
                  { k: "Open alerts", v: "12" },
                  { k: "Agents running", v: "4" },
                  { k: "Compliance score", v: "83%" },
                ].map((s) => (
                  <div key={s.k} className="rounded-xl border border-border/60 bg-background/40 p-3.5">
                    <p className="text-xs text-muted-foreground">{s.k}</p>
                    <p className="mt-1 font-heading text-2xl font-bold text-foreground">{s.v}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Alerts */}
                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <Bell className="size-4 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-foreground">Regulatory alerts</h3>
                  </div>
                  <ul className="space-y-2.5">
                    {ALERTS.map((a) => (
                      <li key={a.t} className="flex items-start gap-2.5">
                        <span
                          className={`mt-1.5 size-1.5 shrink-0 rounded-full ${
                            a.tone === "rose"
                              ? "bg-rose-400"
                              : a.tone === "amber"
                                ? "bg-amber-400"
                                : "bg-[hsl(var(--brand-cyan))]"
                          }`}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-xs text-foreground">{a.t}</p>
                          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {a.tag}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Agent activity */}
                <div className="rounded-xl border border-border/60 bg-background/40 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="size-4 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
                    <h3 className="text-sm font-semibold text-foreground">AI agent activity</h3>
                  </div>
                  <ul className="space-y-3">
                    {AGENTS.map((a) => (
                      <li key={a.name}>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-foreground">{a.name}</span>
                          <span className="text-muted-foreground">{a.state}</span>
                        </div>
                        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-indigo))]"
                            style={{ width: `${a.pct}%` }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
