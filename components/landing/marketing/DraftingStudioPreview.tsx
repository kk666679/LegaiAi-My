"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Wand2,
  ShieldCheck,
  ListChecks,
  AlertTriangle,
  Languages,
  FileSignature,
  Gavel,
  Loader2,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useReveal } from "./use-reveal";
import { cn } from "@/lib/utils";

const TEMPLATES = [
  {
    id: "warning_letter",
    label: "Warning Letter",
    heading: "FORMAL WARNING",
    paragraph:
      "This letter serves as a formal warning regarding the seriousness of your actions and the consequences should similar behaviour recur.",
    authority: "Employment Act 1955 · s.14",
  },
  {
    id: "show_cause_letter",
    label: "Show-Cause Letter",
    heading: "SHOW-CAUSE NOTICE",
    paragraph:
      "You are required to provide a written explanation within seven (7) working days. No disciplinary action will be taken until your reply is considered.",
    authority: "Industrial Relations Act 1967 · s.20",
  },
  {
    id: "legal_letter",
    label: "Legal Letter",
    heading: "WITHOUT PREJUDICE",
    paragraph:
      "We write on behalf of our client to require the sum of RM48,200.00 within fourteen (14) days, failing which proceedings will be commenced.",
    authority: "Contracts Act 1950 · s.10",
  },
];

const DIMENSIONS = [
  { key: "Citation coverage", base: 76 },
  { key: "Citation validity", base: 94 },
  { key: "Evidence grounding", base: 79 },
  { key: "Structure", base: 86 },
];

const ACTIONS = [
  { id: "improve", label: "Improve wording", icon: Wand2, boost: 4 },
  { id: "cautious", label: "Make legally cautious", icon: ShieldCheck, boost: 6 },
  { id: "consistency", label: "Check consistency", icon: ListChecks, boost: 3 },
  { id: "risk", label: "Identify risks", icon: AlertTriangle, boost: 5 },
  { id: "translate", label: "Translate to Malay", icon: Languages, boost: 2 },
];

const TRACE_STEPS = [
  "Retrieve authorities from LOM catalogue",
  "Verify each citation format and section",
  "Apply edit with inline justification",
];

const FIRST_TEMPLATE = TEMPLATES[0]!;

/**
 * Interactive, self-contained preview of the Drafting Studio. Runs a short
 * simulated verification trace so a visitor can feel the review loop before
 * signing in; it never claims to be live data.
 */
export function DraftingStudioPreview() {
  const ref = useReveal<HTMLDivElement>();
  const [templateId, setTemplateId] = useState<string>(FIRST_TEMPLATE.id);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [traceStep, setTraceStep] = useState(-1);
  const [boost, setBoost] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const template = TEMPLATES.find((t) => t.id === templateId) ?? FIRST_TEMPLATE;
  const overall = Math.min(98, 82 + boost);

  const runAction = (id: string, delta: number) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setActiveAction(id);
    setTraceStep(0);
    timers.current.push(setTimeout(() => setTraceStep(1), 420));
    timers.current.push(setTimeout(() => setTraceStep(2), 840));
    timers.current.push(
      setTimeout(() => {
        setBoost(delta);
        setTraceStep(3);
        setActiveAction(null);
      }, 1260),
    );
  };

  return (
    <section
      id="drafting-studio"
      ref={ref}
      className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-10"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[420px] w-[820px] max-w-full -translate-x-1/2 rounded-full bg-[radial-gradient(circle,hsl(var(--brand-indigo)/0.18),transparent_65%)] blur-3xl"
      />
      <div className="mx-auto max-w-[1400px]">
        <div className="mx-auto max-w-2xl text-center">
          <p className="reveal text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--brand-cyan))]">
            Drafting Studio
          </p>
          <h2 className="reveal mt-3 text-balance font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A draft you can defend in a review meeting.
          </h2>
          <p className="reveal mt-4 text-pretty text-base leading-relaxed text-muted-foreground">
            Pick a template, let the drafting agent produce a first pass, then check every
            citation, flag unsupported assertions and keep a version history. Nothing ships
            without a lawyer.
          </p>
        </div>

        <div
          className="reveal mt-12 overflow-hidden rounded-2xl border border-border/70 bg-card/50 shadow-[0_40px_120px_-40px_hsl(var(--brand-indigo)/0.5)]"
          style={{ transitionDelay: "100ms" }}
        >
          {/* window chrome */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 bg-background/60 px-4 py-3">
            <span className="size-2.5 rounded-full bg-rose-400/70" />
            <span className="size-2.5 rounded-full bg-amber-400/70" />
            <span className="size-2.5 rounded-full bg-emerald-400/70" />
            <span className="ml-3 font-mono text-xs text-muted-foreground">
              app.legalai.my/legalai/draft
            </span>
            <span className="ml-auto hidden items-center gap-1.5 rounded-full border border-border/70 px-2.5 py-1 text-[10px] text-muted-foreground sm:inline-flex">
              <Sparkles className="size-3" aria-hidden="true" />
              Human-in-the-loop · L2 draft
            </span>
          </div>

          {/* template switcher */}
          <div className="flex flex-wrap items-center gap-2 border-b border-border/70 px-4 py-3">
            <span className="text-xs text-muted-foreground">Template</span>
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  timers.current.forEach(clearTimeout);
                  timers.current = [];
                  setTemplateId(t.id);
                  setActiveAction(null);
                  setTraceStep(-1);
                  setBoost(0);
                }}
                aria-pressed={t.id === templateId}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  t.id === templateId
                    ? "border-[hsl(var(--brand-blue)/0.5)] bg-[hsl(var(--brand-blue)/0.15)] text-foreground"
                    : "border-border/70 text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* editor + quality rail */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
            <div className="border-b border-border/70 p-5 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center gap-2">
                <FileSignature className="size-4 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
                <span className="text-sm font-semibold text-foreground">Document editor</span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  autosaved · v3
                </span>
              </div>

              <div
                className={cn(
                  "mt-4 space-y-3 rounded-xl border border-border/60 bg-background/40 p-4 transition-colors",
                  activeAction && "border-[hsl(var(--brand-blue)/0.45)]",
                )}
              >
                <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                  Date: 21 August 2026
                </p>
                <p className="font-heading text-sm font-bold tracking-wide text-foreground">
                  {template.heading}
                </p>
                <p className="text-[13px] leading-relaxed text-foreground/90">
                  Dear Mr. Lim Wei Jian,
                </p>
                <p className="text-[13px] leading-relaxed text-foreground/90">
                  {template.paragraph}
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-[hsl(var(--brand-cyan)/0.4)] bg-[hsl(var(--brand-cyan)/0.1)] px-2 py-1">
                  <Gavel className="size-3 text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
                  <span className="text-[10px] font-medium text-foreground">
                    {template.authority}
                  </span>
                  <CheckCircle2 className="size-3 text-emerald-300" aria-hidden="true" />
                </span>
              </div>

              {/* AI actions */}
              <p className="mt-5 text-xs text-muted-foreground">Apply AI to draft</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ACTIONS.map((a) => {
                  const Icon = a.icon;
                  const busy = activeAction === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => runAction(a.id, a.boost)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background/50 px-3 py-1.5 text-xs text-foreground transition-colors hover:border-[hsl(var(--brand-blue)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {busy ? (
                        <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                      ) : (
                        <Icon className="size-3.5" aria-hidden="true" />
                      )}
                      {a.label}
                    </button>
                  );
                })}
              </div>

              {/* verification trace */}
              <ol className="mt-4 space-y-1.5" aria-live="polite">
                {TRACE_STEPS.map((step, i) => (
                  <li
                    key={step}
                    className={cn(
                      "flex items-center gap-2 text-[11px] transition-colors",
                      traceStep >= i ? "text-foreground" : "text-muted-foreground/50",
                    )}
                  >
                    {traceStep > i ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
                    ) : traceStep === i ? (
                      <Loader2 className="size-3.5 shrink-0 animate-spin text-[hsl(var(--brand-cyan))]" aria-hidden="true" />
                    ) : (
                      <span className="size-3.5 shrink-0 rounded-full border border-current" aria-hidden="true" />
                    )}
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            {/* quality rail */}
            <aside className="p-5 sm:p-6">
              <p className="text-sm font-semibold text-foreground">Draft quality</p>

              <div className="mt-4 flex items-center gap-4">
                <div className="relative size-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="size-24 -rotate-90">
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="hsl(var(--border))"
                      strokeWidth="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke="hsl(var(--brand-cyan))"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeDasharray={94}
                      strokeDashoffset={94 - (94 * overall) / 100}
                      className="transition-[stroke-dashoffset] duration-700"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-heading text-2xl font-bold text-foreground">
                    {overall}
                  </span>
                </div>
                <ul className="flex-1 space-y-2">
                  {DIMENSIONS.map((d) => {
                    const value = Math.min(99, d.base + boost);
                    return (
                      <li key={d.key}>
                        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{d.key}</span>
                          <span className="font-mono text-foreground">{value}</span>
                        </div>
                        <span className="mt-1 block h-1 overflow-hidden rounded-full bg-muted">
                          <span
                            className="block h-full rounded-full bg-gradient-to-r from-[hsl(var(--brand-cyan))] to-[hsl(var(--brand-indigo))] transition-[width] duration-700"
                            style={{ width: `${value}%` }}
                            aria-hidden="true"
                          />
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="mt-5 space-y-2 rounded-xl border border-border/60 bg-background/40 p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Validation
                </p>
                {[
                  { t: "Citation format", ok: true },
                  { t: "LOM catalogue match", ok: true },
                  { t: "Unsupported assertions", ok: boost >= 4, note: "0 flagged" },
                ].map((row) => (
                  <p key={row.t} className="flex items-center gap-2 text-[11px] text-foreground">
                    {row.ok ? (
                      <CheckCircle2 className="size-3.5 shrink-0 text-emerald-300" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="size-3.5 shrink-0 text-amber-300" aria-hidden="true" />
                    )}
                    <span className="flex-1">{row.t}</span>
                    {row.note && <span className="text-muted-foreground">{row.note}</span>}
                  </p>
                ))}
              </div>

              <Link
                href="/legalai/documents/studio"
                className="group mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] px-5 py-3 text-sm font-semibold text-primary-foreground shadow-[0_16px_40px_-18px_hsl(var(--brand-blue))] transition-all hover:shadow-[0_20px_50px_-14px_hsl(var(--brand-blue))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Open Drafting Studio
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">
                Interactive preview · illustrative figures, not live data.
              </p>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}