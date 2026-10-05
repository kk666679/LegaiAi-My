"use client";

import * as React from "react";

/* ------------------------------------------------------------------ */
/*  shadcn/ui primitives                                              */
/* ------------------------------------------------------------------ */
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/* ------------------------------------------------------------------ */
/*  icons                                                             */
/* ------------------------------------------------------------------ */
import {
  ArrowUpRight,
  CalendarClock,
  Command,
  Download,
  FileSignature,
  LayoutGrid,
  List as ListIcon,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  domain components                                                 */
/* ------------------------------------------------------------------ */
import { DocumentsHeader } from "@/components/documents/core/documents-header";
import { DocumentsBreadcrumbs } from "@/components/documents/core/documents-breadcrumbs";
import { DocumentsToolbar } from "@/components/documents/core/documents-toolbar";

import { DocumentList } from "@/components/documents/library/document-list";
import { DocumentPagination } from "@/components/documents/library/document-pagination";

import { DocumentPreview } from "@/components/documents/preview/document-preview";

import { DocumentAIWorkspace } from "@/components/documents/ai/document-ai-workspace";

import { DocumentAnalysis } from "@/components/documents/analysis/document-analysis";
import { DocumentActivityFeed } from "@/components/documents/activity/document-activity-feed";
import { EvidenceList } from "@/components/documents/evidence/evidence-list";
import { ComparisonWorkspace } from "@/components/documents/comparison/comparison-workspace";

import { DocumentStatusIndicator } from "@/components/documents/status/document-status-indicator";

/* ------------------------------------------------------------------ */
/*  types                                                             */
/* ------------------------------------------------------------------ */
import type {
  LegalDocument,
  DocumentActivityEvent,
  DocumentAnalysisFinding,
  DocumentEvidence,
} from "@/components/documents/types";

/* ------------------------------------------------------------------ */
/*  mock data                                                         */
/* ------------------------------------------------------------------ */

const DOCUMENTS = [
  {
    id: "doc_msa",
    name: "Master Services Agreement",
    type: "PDF",
    status: "in_review",
    updatedAt: "2026-10-03T09:41:00.000Z",
    pageCount: 24,
    url: "/samples/msa.pdf",
    category: "Commercial",
    parties: [{ name: "Northwind Ltd" }, { name: "Acme Inc" }],
  },
  {
    id: "doc_nda",
    name: "NDA — Helios Robotics",
    type: "PDF",
    status: "draft",
    updatedAt: "2026-10-02T16:20:00.000Z",
    pageCount: 6,
    url: "/samples/nda.pdf",
    category: "NDA",
    parties: [{ name: "Helios Robotics" }],
  },
  {
    id: "doc_saas",
    name: "SaaS Subscription Terms",
    type: "PDF",
    status: "signed",
    updatedAt: "2026-09-28T11:05:00.000Z",
    pageCount: 18,
    url: "/samples/saas.pdf",
    category: "Software",
    parties: [{ name: "Vertex Cloud" }],
  },
  {
    id: "doc_emp",
    name: "Employment Agreement — S. Okafor",
    type: "PDF",
    status: "signed",
    updatedAt: "2026-09-21T08:12:00.000Z",
    pageCount: 11,
    url: "/samples/emp.pdf",
    category: "Employment",
  },
  {
    id: "doc_dpa",
    name: "Data Processing Addendum",
    type: "PDF",
    status: "in_review",
    updatedAt: "2026-09-18T14:33:00.000Z",
    pageCount: 9,
    url: "/samples/dpa.pdf",
    category: "Privacy",
    parties: [{ name: "Northwind Ltd" }],
  },
] as unknown as LegalDocument[];

const ACTIVITY: DocumentActivityEvent[] = [
  {
    id: "evt_1",
    actorName: "Aria Reyes",
    kind: "applied an AI redline to §3",
    message: "Replaced 2.5% with the 1.5% playbook fallback.",
    timestamp: "2026-10-03T09:42:00.000Z",
  },
  {
    id: "evt_2",
    actorName: "Kenji Park",
    kind: "commented on §5",
    message: "Cap feels light for a deal of this size — suggest 2× fees.",
    timestamp: "2026-10-03T09:18:00.000Z",
  },
  {
    id: "evt_3",
    actorName: "Studio AI",
    kind: "flagged 2 risks",
    message: "Interest rate above cap · no cure period before accrual.",
    timestamp: "2026-10-03T09:41:00.000Z",
  },
  {
    id: "evt_4",
    actorName: "Mara Singh",
    kind: "shared the document",
    message: "Shared with the Northwind legal team.",
    timestamp: "2026-10-02T17:04:00.000Z",
  },
] as unknown as DocumentActivityEvent[];

const FINDINGS = [
  {
    id: "f_1",
    severity: "high",
    title: "Interest rate exceeds playbook cap",
    detail:
      "2.5% per month exceeds the approved 1.5% ceiling and may be unenforceable in several jurisdictions.",
    clause: "§3",
  },
  {
    id: "f_2",
    severity: "medium",
    title: "No cure period before interest accrues",
    detail:
      "Standard position requires a 10-day cure window. Consider adding: “following written notice and a 10-day cure period.”",
    clause: "§3",
  },
  {
    id: "f_3",
    severity: "low",
    title: "IP assignment conditioned on full payment",
    detail:
      "Assignment conditional on payment is acceptable but consider a license-back for pre-existing IP.",
    clause: "§4",
  },
] as unknown as DocumentAnalysisFinding[];

const EVIDENCE = [
  {
    id: "e_1",
    section: "Fees and Payment",
    page: 4,
    excerpt:
      "Late payments shall accrue interest at the rate of 2.5% per month, compounding monthly.",
    confidence: 0.97,
    relevance: "Direct deviation from playbook §4.2 (interest cap 1.5%).",
  },
  {
    id: "e_2",
    section: "Fees and Payment",
    page: 4,
    excerpt:
      "The Client shall pay all undisputed invoices within thirty (30) days of receipt.",
    confidence: 0.99,
    relevance: "Matches approved Net 30 position.",
  },
  {
    id: "e_3",
    section: "Intellectual Property",
    page: 9,
    excerpt:
      "All intellectual property rights... shall vest in the Client upon full payment of the applicable fees.",
    confidence: 0.91,
    relevance: "Assignment conditioned on payment — review license-back.",
  },
] as unknown as DocumentEvidence[];

/* ------------------------------------------------------------------ */
/*  local subcomponents                                               */
/* ------------------------------------------------------------------ */

function StudioAIAssistant() {
  const [message, setMessage] = React.useState("");

  const messages = [
    {
      id: "m1",
      role: "user" as const,
      author: "Aria Reyes",
      initials: "AR",
      text: "Summarise the payment terms and flag anything outside our standard position.",
      time: "09:41",
    },
    {
      id: "m2",
      role: "ai" as const,
      text: (
        <>
          <p className="mb-2">
            Payment terms are <strong className="font-semibold text-foreground">Net 30</strong>, which
            matches your playbook. Two deviations found:
          </p>
          <ul className="space-y-1.5">
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-rose-400" />
              <span>
                Interest at <strong className="text-rose-300">2.5% / month</strong> — above your 1.5% cap.
              </span>
            </li>
            <li className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-400" />
              <span>No cure period before interest accrues.</span>
            </li>
          </ul>
        </>
      ),
      chips: ["Redline §3", "Show evidence", "Counter-propose"],
      time: "09:41",
    },
    {
      id: "m3",
      role: "user" as const,
      author: "Aria Reyes",
      initials: "AR",
      text: "Draft a counter-proposal for clause 3.",
      time: "09:42",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="flex gap-2.5">
              <Avatar className="size-6">
                <AvatarFallback className="bg-gradient-to-br from-violet-400 to-fuchsia-500 text-[9px] font-semibold text-white">
                  {m.initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="rounded-xl rounded-tl-sm border border-border/60 bg-muted/40 px-3 py-2 text-[12.5px] leading-relaxed">
                  {m.text}
                </div>
                <div className="mt-1 font-mono text-[10px] text-muted-foreground/60">{m.time}</div>
              </div>
            </div>
          ) : (
            <div key={m.id} className="flex gap-2.5">
              <div className="grid size-6 shrink-0 place-items-center rounded-md bg-gradient-to-br from-emerald-400 to-teal-600 text-emerald-950">
                <Sparkles className="size-3.5" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="rounded-xl rounded-tl-sm border border-border/60 bg-muted/40 px-3 py-2.5 text-[12.5px] leading-relaxed text-foreground/85">
                  {m.text}
                </div>
                {m.chips ? (
                  <div className="flex flex-wrap gap-1.5">
                    {m.chips.map((c) => (
                      <button
                        key={c}
                        className="rounded-md border border-border bg-background/60 px-2 py-1 text-[10.5px] text-muted-foreground transition hover:bg-accent hover:text-foreground"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : null}
                <div className="font-mono text-[10px] text-muted-foreground/60">
                  {m.time} · 3 sources cited
                </div>
              </div>
            </div>
          ),
        )}

        <div className="flex items-center gap-2 pl-8">
          <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
          <span className="size-1.5 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
          <span className="ml-1 text-[11px] text-muted-foreground">Drafting…</span>
        </div>
      </div>

      <div className="border-t border-border/60 p-3">
        <div className="rounded-xl border border-border bg-muted/30 p-2 transition focus-within:border-emerald-400/40">
          <textarea
            rows={2}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Studio AI, or type / for commands…"
            className="w-full resize-none bg-transparent px-1.5 py-1 text-[12.5px] outline-none placeholder:text-muted-foreground/60"
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <div className="flex items-center gap-1">
              <button className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <Plus className="size-3.5" />
              </button>
              <button className="grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground">
                <Command className="size-3.5" />
              </button>
            </div>
            <Button size="icon" className="size-7 rounded-lg bg-gradient-to-b from-emerald-400 to-emerald-500 text-emerald-950 hover:brightness-110">
              <ArrowUpRight className="size-3.5" />
            </Button>
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-muted-foreground/60">
          Studio AI can make mistakes. Verify citations before filing.
        </p>
      </div>
    </div>
  );
}

function DraftCanvas({ document }: { document: LegalDocument }) {
  return (
    <div className="mx-auto max-w-[860px] px-4 py-8 sm:px-8">
      {/* Clause outline strip */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        {["1. Definitions", "2. Scope", "3. Fees ⚠", "4. IP", "5. Liability", "6. Term"].map(
          (c, i) => (
            <span
              key={c}
              className={
                i === 2
                  ? "shrink-0 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-[10.5px] font-medium text-rose-300"
                  : "shrink-0 rounded-full bg-muted/60 px-2.5 py-1 text-[10.5px] font-medium text-muted-foreground"
              }
            >
              {c}
            </span>
          ),
        )}
      </div>

      {/* Paper */}
      <div className="paper relative rounded-xl px-8 py-10 sm:px-14 sm:py-14">
        <div className="mb-8 flex items-start justify-between border-b border-black/10 pb-5">
          <div>
            <div className="font-mono text-[9.5px] uppercase tracking-[0.18em] text-black/40">
              Drafting Studio · v14
            </div>
            <h2 className="mt-1.5 font-serif text-[26px] font-medium leading-tight tracking-tight text-black/90">
              {document.name}
            </h2>
          </div>
          <div className="rounded-md border border-black/10 px-2 py-1 font-mono text-[9.5px] text-black/45">
            MSA-2026-0417
          </div>
        </div>

        <div className="font-serif text-[15px] leading-[1.85] text-black/80">
          <h3 className="mb-2 mt-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">
            1. Definitions
          </h3>
          <p className="mb-4">
            “Confidential Information” means any non-public information disclosed by either party,
            whether orally, in writing, or by inspection of tangible objects, that is designated as
            confidential or that reasonably should be understood to be confidential.
          </p>

          <h3 className="mb-2 mt-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">
            2. Scope of Services
          </h3>
          <p className="mb-4">
            The Supplier shall perform the services described in each Statement of Work executed by
            the parties, in accordance with the timelines and specifications set out therein.
          </p>

          <h3 className="mb-2 mt-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">
            3. Fees and Payment
          </h3>
          <p className="mb-3">
            The Client shall pay all undisputed invoices within{" "}
            <span className="relative mx-1 inline-block">
              <span className="absolute -inset-x-1 -inset-y-0.5 rounded bg-emerald-300/25" />
              <span className="relative font-medium">thirty (30) days</span>
            </span>{" "}
            of receipt. Late payments shall accrue interest at{" "}
            <span className="rounded bg-rose-300/30 px-1 font-medium">
              the rate of 2.5% per month
            </span>
            , compounding monthly.
          </p>

          {/* Inline AI suggestion */}
          <div className="my-5 rounded-lg border border-emerald-700/25 bg-emerald-50/80 p-3.5 shadow-sm">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-emerald-700" strokeWidth={2.2} />
              <span className="font-sans text-[10.5px] font-semibold uppercase tracking-wider text-emerald-800">
                Studio suggestion
              </span>
              <span className="ml-auto rounded-full bg-emerald-700/10 px-2 py-0.5 font-sans text-[9.5px] font-medium text-emerald-800">
                Playbook §4.2
              </span>
            </div>
            <p className="font-sans text-[12.5px] leading-relaxed text-black/70">
              Interest above <strong className="font-semibold">1.5% per month</strong> exceeds your
              standard commercial position and may be unenforceable in several jurisdictions. Replace
              with the approved fallback from your playbook.
            </p>
            <div className="mt-2.5 flex items-center gap-2">
              <button className="rounded-md bg-emerald-700 px-2.5 py-1 font-sans text-[11px] font-medium text-white transition hover:bg-emerald-800">
                Apply fallback
              </button>
              <button className="rounded-md border border-black/15 px-2.5 py-1 font-sans text-[11px] font-medium text-black/60 transition hover:bg-black/5">
                Explain
              </button>
              <button className="ml-auto font-sans text-[11px] text-black/40 transition hover:text-black/70">
                Dismiss
              </button>
            </div>
          </div>

          <p className="mb-4">
            All amounts are exclusive of value added tax and any other applicable duties.
          </p>

          <h3 className="mb-2 mt-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">
            4. Intellectual Property
          </h3>
          <p className="mb-4">
            All intellectual property rights created by the Supplier in the course of performing the
            Services shall vest in the Client upon full payment of the applicable fees.
          </p>

          <h3 className="mb-2 mt-6 font-sans text-[11px] font-semibold uppercase tracking-[0.14em] text-black/50">
            5. Limitation of Liability
          </h3>
          <p className="mb-4">
            Neither party shall be liable for indirect or consequential loss. The Supplier’s
            aggregate liability shall not exceed the total fees paid in the twelve (12) months
            preceding the claim.
          </p>

          <p className="mt-8 font-sans text-[12px] text-black/35">
            — End of preview · {document.pageCount ?? "—"} pages total —
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground">
          <span className="size-1.5 rounded-full bg-emerald-400" />
          Autosaved · 2 minutes ago
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            ⌘
          </kbd>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[10px]">
            K
          </kbd>
          <span className="ml-1">for commands</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  page                                                              */
/* ------------------------------------------------------------------ */

export default function DraftingStudioPage() {
  const [selectedId, setSelectedId] = React.useState(DOCUMENTS[0]?.id ?? "");
  const [tab, setTab] = React.useState("draft");
  const [view, setView] = React.useState<"list" | "grid">("list");
  const [query, setQuery] = React.useState("");
  const [page, setPage] = React.useState(1);
  const pageSize = 8;

  const filtered = React.useMemo(
    () =>
      DOCUMENTS.filter((d) =>
        (d.name ?? "").toLowerCase().includes(query.trim().toLowerCase()),
      ),
    [query],
  );

  const selected = React.useMemo(
    () => DOCUMENTS.find((d) => d.id === selectedId) ?? DOCUMENTS[0],
    [selectedId],
  );

  const handleAction = React.useCallback((id: string) => {
    // Route to real handlers in production.
    // eslint-disable-next-line no-console
    console.log("[studio] ai action:", id);
  }, []);

  if (!selected) {
    return <main className="p-6 text-sm text-muted-foreground">No documents are available.</main>;
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Decorative aurora */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0 opacity-40"
        style={{
          background:
            "radial-gradient(60vw 60vw at 0% 0%, color-mix(in oklab, hsl(var(--primary)) 22%, transparent), transparent 60%), radial-gradient(60vw 60vw at 100% 100%, color-mix(in oklab, hsl(var(--accent)) 18%, transparent), transparent 60%)",
        }}
      />

      <div className="relative z-10 flex min-h-0 flex-1">
        {/* ============================================================ */}
        {/* LEFT SIDEBAR — Library                                       */}
        {/* ============================================================ */}
        <aside className="hidden w-[300px] shrink-0 flex-col border-r border-border/60 bg-muted/20 md:flex">
          <div className="flex items-center gap-2 p-3">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter documents…"
                className="h-8 pl-8 text-[12px]"
              />
            </div>
            <Button size="icon" variant="outline" className="size-8 shrink-0">
              <Plus className="size-4" />
            </Button>
          </div>

          <div className="flex items-center gap-1 px-3 pb-2">
            <button className="flex-1 rounded-md bg-accent px-2 py-1 text-[11px] font-medium">
              All
            </button>
            <button className="flex-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground">
              Drafts
            </button>
            <button className="flex-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-foreground">
              Signed
            </button>
            <button
              onClick={() => setView(view === "list" ? "grid" : "list")}
              className="ml-1 grid size-6 place-items-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              aria-label="Toggle view"
            >
              {view === "list" ? (
                <LayoutGrid className="size-3.5" />
              ) : (
                <ListIcon className="size-3.5" />
              )}
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
            <DocumentList
              documents={filtered}
              onOpen={(doc) => setSelectedId(doc.id)}
              onFavoriteChange={() => undefined}
              onMenu={() => undefined}
              showFavorite
            />
          </div>

          <div className="border-t border-border/60 px-3 py-2">
            <DocumentPagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
            />
          </div>

          <div className="border-t border-border/60 p-3">
            <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
              <div className="min-w-0">
                <div className="text-[10.5px] font-medium text-foreground/80">Clause credits</div>
                <div className="text-[10px] text-muted-foreground">Renews in 12 days</div>
              </div>
              <div className="font-mono text-[13px] font-semibold text-emerald-300">847</div>
            </div>
          </div>
        </aside>

        {/* ============================================================ */}
        {/* MAIN                                                        */}
        {/* ============================================================ */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <DocumentsHeader
            breadcrumbs={
              <DocumentsBreadcrumbs
                items={[
                  { label: "Studio", href: "/studio" },
                  { label: selected.category ?? "Documents", href: "/studio/library" },
                  { label: selected.name },
                ]}
              />
            }
            title={
              <span className="flex items-center gap-2.5">
                {selected.name}
                <DocumentStatusIndicator status={selected.status} />
              </span>
            }
            description={
              <span className="flex flex-wrap items-center gap-2">
                <span>
                  {selected.parties?.map((p) => p.name).join(" · ") ??
                    selected.category ??
                    "Document"}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="size-3" />
                  {new Date(selected.updatedAt).toLocaleString()}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <ShieldCheck className="size-3" /> 94% AI confidence
                </span>
              </span>
            }
            actions={
              <>
                <div className="mr-1 hidden items-center -space-x-2 sm:flex">
                  {[
                    { i: "JM", c: "from-sky-400 to-blue-600" },
                    { i: "KP", c: "from-rose-400 to-pink-600" },
                  ].map((a) => (
                    <div
                      key={a.i}
                      className={`grid size-7 place-items-center rounded-full border-2 border-background bg-gradient-to-br ${a.c} text-[9px] font-semibold text-white`}
                    >
                      {a.i}
                    </div>
                  ))}
                  <div className="grid size-7 place-items-center rounded-full border-2 border-background bg-muted text-[9px] font-semibold text-muted-foreground">
                    +3
                  </div>
                </div>
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Download className="size-3.5" /> Export
                </Button>
                <Button size="sm" className="gap-1.5 bg-gradient-to-b from-emerald-400 to-emerald-500 text-emerald-950 hover:brightness-110">
                  <FileSignature className="size-3.5" /> Send for signature
                </Button>
              </>
            }
          />

          <Tabs
            value={tab}
            onValueChange={setTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="flex items-center justify-between border-b border-border/60 bg-muted/20 px-3">
              <TabsList className="bg-transparent">
                <TabsTrigger value="draft" className="text-[12.5px]">
                  Draft
                </TabsTrigger>
                <TabsTrigger value="preview" className="text-[12.5px]">
                  Preview
                </TabsTrigger>
                <TabsTrigger value="compare" className="text-[12.5px]">
                  Compare
                </TabsTrigger>
                <TabsTrigger value="analysis" className="text-[12.5px]">
                  Analysis
                </TabsTrigger>
                <TabsTrigger value="activity" className="text-[12.5px]">
                  Activity
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-1.5 py-1.5">
                <Button variant="outline" size="sm" className="hidden gap-1.5 sm:inline-flex">
                  <Wand2 className="size-3.5" /> Track changes
                </Button>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-muted/10">
              <TabsContent value="draft" className="m-0">
                <DraftCanvas document={selected} />
              </TabsContent>

              <TabsContent value="preview" className="m-0 h-full">
                <DocumentPreview
                  document={selected}
                  page={1}
                  onPageChange={() => undefined}
                  onDownload={() => undefined}
                  onPrint={() => undefined}
                  onSearch={() => undefined}
                  onFullscreen={() => undefined}
                />
              </TabsContent>

              <TabsContent value="compare" className="m-0 h-full">
                <ComparisonWorkspace
                  summary={
                    <span className="flex items-center gap-2 text-[12.5px]">
                      <Sparkles className="size-3.5 text-emerald-400" />
                      3 substantive changes detected between v13 and v14.
                    </span>
                  }
                  left={{
                    label: "v13 · prior round",
                    content: (
                      <div className="space-y-3 text-[12.5px] leading-relaxed text-muted-foreground">
                        <p>
                          Late payments shall accrue interest at the rate of{" "}
                          <span className="rounded bg-rose-500/15 px-1 text-rose-300">
                            1.5% per month
                          </span>
                          .
                        </p>
                        <p>
                          The Supplier’s aggregate liability shall not exceed the total fees paid in
                          the twelve (12) months preceding the claim.
                        </p>
                      </div>
                    ),
                  }}
                  right={{
                    label: "v14 · current",
                    content: (
                      <div className="space-y-3 text-[12.5px] leading-relaxed text-muted-foreground">
                        <p>
                          Late payments shall accrue interest at the rate of{" "}
                          <span className="rounded bg-emerald-500/15 px-1 text-emerald-300">
                            2.5% per month
                          </span>
                          , compounding monthly.
                        </p>
                        <p>
                          The Supplier’s aggregate liability shall not exceed the total fees paid in
                          the twelve (12) months preceding the claim.
                        </p>
                      </div>
                    ),
                  }}
                />
              </TabsContent>

              <TabsContent value="analysis" className="m-0">
                <DocumentAnalysis
                  summary="Commercial MSA between Northwind Ltd and Acme Inc. Net 30 payment terms, mutual confidentiality, IP assignment on payment, and a 12-month liability cap. Two deviations from your standard commercial playbook require attention before signature."
                  confidence={0.94}
                  findings={FINDINGS}
                  onSelectFinding={() => undefined}
                />
              </TabsContent>

              <TabsContent value="activity" className="m-0">
                <div className="mx-auto max-w-2xl p-6">
                  <h2 className="mb-4 text-sm font-medium">Recent activity</h2>
                  <DocumentActivityFeed events={ACTIVITY} />
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>

        {/* ============================================================ */}
        {/* RIGHT RAIL — AI                                              */}
        {/* ============================================================ */}
        <aside className="hidden w-[380px] shrink-0 flex-col border-l border-border/60 bg-muted/20 xl:flex">
          <DocumentAIWorkspace
            onAction={handleAction}
            assistantSlot={<StudioAIAssistant />}
            insightsSlot={
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="size-3.5 text-emerald-400" /> Key findings
                </div>
                {FINDINGS.map((f) => (
                  <Card key={f.id} className="space-y-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12.5px] font-medium">{f.title}</p>
                      <span
                        className={
                          "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium " +
                          (f.severity === "high"
                            ? "bg-rose-500/15 text-rose-300"
                            : f.severity === "medium"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-sky-500/15 text-sky-300")
                        }
                      >
                        {f.severity}
                      </span>
                    </div>
                    <p className="text-[11.5px] leading-relaxed text-muted-foreground">
                      {f.summary ?? f.title}
                    </p>
                    <p className="pt-0.5 font-mono text-[10px] text-muted-foreground/70">
                      {f.kind}
                    </p>
                  </Card>
                ))}
              </div>
            }
            evidenceSlot={<EvidenceList items={EVIDENCE} onSelect={() => undefined} />}
          />
        </aside>
      </div>

      {/* ============================================================ */}
      {/* FOOTER STATUS BAR                                            */}
      {/* ============================================================ */}
      <footer className="relative z-10 flex items-center justify-between border-t border-border/60 bg-background/80 px-4 py-1.5 text-[10.5px] text-muted-foreground backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Connected
          </span>
          <Separator orientation="vertical" className="h-3" />
          <span>Workspace: Northwind · Legal</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 sm:inline-flex">
            <Star className="size-3" /> 2 favourites
          </span>
          <Separator orientation="vertical" className="hidden h-3 sm:block" />
          <span className="font-mono">v14 · 2026-10-03 09:41</span>
        </div>
      </footer>
    </div>
  );
}