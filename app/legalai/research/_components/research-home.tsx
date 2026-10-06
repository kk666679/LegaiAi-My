"use client";
// app/legalai/research/_components/research-home.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BarChart3, BookOpen, FileText, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ResearchSearchBar } from "./research-search-bar";
import { ResearchScopeSelector } from "./research-scope-selector";
import { SessionCard } from "./session-card";
import { useResearch } from "./use-research";
import { DashboardMetrics } from "@/components/dashboard/DashboardMetrics";
import { RecentActivityFeed } from "@/components/dashboard/RecentActivityFeed";
import { SavedResearch } from "@/components/dashboard/SavedResearch";
import { trpcReact } from "@/clients";
import {
  toDashboardActivity,
  toDashboardMetrics,
  toDashboardSavedItems,
} from "./legalai-dashboard-adapters";
import type { ResearchScope } from "./types";

const SAMPLE_QUERIES = [
  "Is a domestic inquiry required before dismissal for misconduct?",
  "What are a director's fiduciary duties under the Companies Act 2016?",
  "Limitation period for a claim in contract in Malaysia",
  "Data subject access rights under the PDPA 2010",
];

const RETRIEVAL_COURT_FILTERS = {
  "federal-court": "FEDERAL",
  "court-of-appeal": "APPEAL",
  "high-court": "HIGH",
  "sessions-court": "SESSIONS",
  "magistrate-court": "MAGISTRATE",
} as const;

function isRetrievalCourtLevel(value: string): value is keyof typeof RETRIEVAL_COURT_FILTERS {
  return Object.hasOwn(RETRIEVAL_COURT_FILTERS, value);
}

export function ResearchHomePage() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [queuedJob, setQueuedJob] = React.useState<{ jobId?: string; traceId: string } | null>(null);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [scope, setScope] = React.useState<ResearchScope>({
    jurisdictions: ["MY"],
    kinds: ["case", "statute", "regulation", "practice-direction", "constitutional"],
    includeSecondary: false,
  });

  const retrieval = trpcReact.agents.retrieve.useMutation();
  const { sessions, stats } = useResearch({ scope: "recent" });
  const metrics = React.useMemo(() => toDashboardMetrics(stats), [stats]);
  const savedItems = React.useMemo(() => toDashboardSavedItems(sessions), [sessions]);
  const activityItems = React.useMemo(() => toDashboardActivity(sessions), [sessions]);

  const handleSubmit = async () => {
    const searchQuery = query.trim();
    if (!searchQuery || retrieval.isPending) return;

    setQueuedJob(null);
    setSearchError(null);
    try {
      const selectedCourtLevel = scope.courtLevels?.length === 1 ? scope.courtLevels[0] : undefined;
      const selectedCourt =
        selectedCourtLevel && isRetrievalCourtLevel(selectedCourtLevel)
          ? RETRIEVAL_COURT_FILTERS[selectedCourtLevel]
          : undefined;
      const result = await retrieval.mutateAsync({
        query: searchQuery,
        filters: {
          ...(selectedCourt ? { court: selectedCourt } : {}),
          ...(scope.dateFrom ? { dateFrom: scope.dateFrom } : {}),
          ...(scope.dateTo ? { dateTo: scope.dateTo } : {}),
        },
        topK: 10,
      });
      if (typeof result.traceId !== "string") {
        throw new Error("The retrieval service returned an invalid job response");
      }
      setQueuedJob({
        ...(typeof result.jobId === "string" ? { jobId: result.jobId } : {}),
        traceId: result.traceId,
      });
      toast.success("Research retrieval queued");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not queue research retrieval";
      setSearchError(message);
      toast.error("Could not start research");
    }
  };

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-4xl px-4 py-12">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Legal research, grounded in Malaysian authority</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ask a legal question. LegAI searches statutes, cases, and practice directions — every proposition is cited.
          </p>
        </div>

        <ResearchSearchBar
          value={query}
          onChange={setQuery}
          onSubmit={handleSubmit}
          submitting={retrieval.isPending}
          hero
        />

        {searchError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            {searchError}
          </p>
        ) : null}

        {queuedJob ? (
          <div className="mt-3 rounded-lg border border-border/60 bg-muted/30 p-3 text-sm" role="status">
            <p className="font-medium">Retrieval job queued</p>
            <p className="mt-1 text-muted-foreground">
              The backend accepted this search, but this UI cannot yet retrieve completed results or save research sessions.
              Only date filters and a single supported court filter are sent; jurisdiction and source-type filters are not applied.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {queuedJob.jobId ? `Job ${queuedJob.jobId} · ` : ""}Trace {queuedJob.traceId}
            </p>
          </div>
        ) : null}

        <p className="mt-3 text-xs text-muted-foreground">
          Recent sessions, saved research, memos, and collections shown here are demo data and are not persisted.
        </p>

        <div className="mt-3 flex items-start justify-between gap-4">
          <ResearchScopeSelector scope={scope} onChange={setScope} />
          <div className="hidden shrink-0 text-right text-[11px] text-muted-foreground md:block">
            {stats ? (
              <>
                <div>{stats.totalSessions} sessions</div>
                <div>{stats.totalAuthorities} authorities indexed</div>
              </>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">Try one of these</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {SAMPLE_QUERIES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="flex items-start gap-2 rounded-lg border border-border/60 bg-card p-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
              >
                <BookOpen className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                {s}
              </button>
            ))}
          </div>
        </div>

        {sessions.length > 0 ? (
          <div className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent research</p>
              <button
                type="button"
                onClick={() => router.push("/legalai/research/history")}
                className="text-xs text-primary hover:underline"
              >
                View all
              </button>
            </div>
            <div className="space-y-2">
              {sessions.slice(0, 4).map((s) => (
                <SessionCard
                  key={s.id}
                  session={s}
                  variant="row"
                  onOpen={() => router.push(`/legalai/research/${s.id}/results`)}
                />
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="flex items-start gap-3 p-4">
            <div className="rounded-md bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
              <BookOpen className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Grounding</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Malaysian legislation, case law, and MOHR practice notes.
              </p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-4">
            <div className="rounded-md bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
              <FileText className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Memos</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Auto-draft an IRAC memo from your findings. Edit before exporting.
              </p>
            </div>
          </Card>
          <Card className="flex items-start gap-3 p-4">
            <div className="rounded-md bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
              <BarChart3 className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium">Audit-ready</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Every step, source, and confidence is logged for review.
              </p>
            </div>
          </Card>
        </div>

        {metrics.length > 0 ? (
          <div className="mt-10">
            <DashboardMetrics metrics={metrics} />
          </div>
        ) : null}

        <div className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <SavedResearch
            items={savedItems}
            heading="Saved research"
            compact
            onOpen={(item) => {
              if (item.href) router.push(item.href);
            }}
          />
          <RecentActivityFeed items={activityItems} heading="Recent activity" compact />
        </div>
      </div>
    </div>
  );
}
