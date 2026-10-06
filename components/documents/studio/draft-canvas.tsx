"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import type { LegalDocument } from "../types";

interface DraftCanvasProps {
  document: LegalDocument;
  className?: string;
}

const CLAUSES = [
  "1. Definitions",
  "2. Scope",
  "3. Fees ⚠",
  "4. IP",
  "5. Liability",
  "6. Term",
];

export function DraftCanvas({ document, className }: DraftCanvasProps) {
  return (
    <div className={`mx-auto max-w-[860px] px-4 py-8 sm:px-8 ${className ?? ""}`}>
      {/* Clause outline strip */}
      <div className="mb-5 flex items-center gap-2 overflow-x-auto pb-1">
        {CLAUSES.map((c, i) => (
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
        ))}
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
            &ldquo;Confidential Information&rdquo; means any non-public information disclosed by either party,
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
            Neither party shall be liable for indirect or consequential loss. The Supplier&rsquo;s
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
