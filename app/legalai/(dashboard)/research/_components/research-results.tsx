"use client";
// app/legalai/research/_components/research-results.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { Bookmark, BookmarkCheck, Download, GitCompare, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useResearch } from "./use-research";
import { ResearchSearchBar } from "./research-search-bar";
import { AuthorityFilters } from "./authority-filters";
import { ResearchResultsHeader } from "./research-results-header";
import { ResearchLoading, ResearchEmpty } from "./research-states";
import { SourceList } from "@/components/dashboard/SourceList";
import { QueryResults } from "@/components/dashboard/QueryResults";
import { DashboardStateBoundary } from "@/components/dashboard/DashboardState";
import {
  toDashboardQueryResult,
  toDashboardSources,
  toDashboardStatus,
} from "./legalai-dashboard-adapters";
import type { Authority, ResearchFilters, ResearchSort } from "./types";

export function ResearchResultsPage({ id }: { id: string }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [filters, setFilters] = React.useState<ResearchFilters>({});
  const [sort, setSort] = React.useState<ResearchSort>({ key: "relevance", direction: "desc" });
  const [compareIds, setCompareIds] = React.useState<string[]>([]);

  const {
    activeSession,
    sessionAuthorities,
    sessionFindings,
    sessionReasoning,
    sessionMemo,
    saveSession,
    sessionsLoading,
  } = useResearch({ sessionId: id, filters, sort });

  // Apply filters
  const filtered = React.useMemo(() => {
    let list = sessionAuthorities;
    if (filters.kinds?.length) list = list.filter((a) => filters.kinds!.includes(a.kind));
    if (filters.courts?.length) list = list.filter((a) => a.court && filters.courts!.includes(a.court));
    if (filters.minConfidence) list = list.filter((a) => (a.confidence ?? 0) >= filters.minConfidence!);
    if (sort.key === "relevance") {
      list = [...list].sort((a, b) => ((b.relevance ?? 0) - (a.relevance ?? 0)) * (sort.direction === "desc" ? 1 : -1));
    } else if (sort.key === "year") {
      list = [...list].sort((a, b) => (a.year - b.year) * (sort.direction === "desc" ? -1 : 1));
    }
    return list;
  }, [sessionAuthorities, filters, sort]);

  const dashboardStatus = activeSession ? toDashboardStatus(activeSession.status) : "loading";
  const queryResult = activeSession
    ? toDashboardQueryResult(activeSession, sessionReasoning, sessionFindings, sessionAuthorities, sessionMemo)
    : undefined;
  const filteredSources = React.useMemo(() => {
    const ids = new Set(filtered.map((a) => a.id));
    return toDashboardSources(sessionAuthorities).filter((s) => ids.has(s.id));
  }, [filtered, sessionAuthorities]);

  if (sessionsLoading) {
    return <div className="p-4"><ResearchLoading rows={5} /></div>;
  }

  if (!activeSession) {
    return (
      <div className="p-6">
        <ResearchEmpty title="Session not found" description="This research session could not be loaded." />
      </div>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[1fr_minmax(320px,420px)]">
      <div className="min-h-0 overflow-y-auto">
        <div className="space-y-4 p-4">
          <ResearchResultsHeader
            session={activeSession}
            sort={sort}
            onSortChange={setSort}
            actions={
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    saveSession(id, !activeSession.saved);
                    toast.success(activeSession.saved ? "Removed from saved" : "Saved");
                  }}
                >
                  {activeSession.saved ? (
                    <><BookmarkCheck className="size-3.5" /> Saved</>
                  ) : (
                    <><Bookmark className="size-3.5" /> Save</>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => router.push(`/legalai/research/${id}/memo`)}
                >
                  <Download className="size-3.5" /> Memo
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    if (compareIds.length >= 2) {
                      router.push(`/legalai/research/compare?a=${compareIds[0]}&b=${compareIds[1]}`);
                    } else {
                      toast.message("Select two authorities to compare");
                    }
                  }}
                >
                  <GitCompare className="size-3.5" /> Compare
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5"
                  onClick={() => toast.success("Share link copied")}
                >
                  <Share2 className="size-3.5" />
                </Button>
              </>
            }
          />

          <ResearchSearchBar
            value={query}
            onChange={setQuery}
            onSubmit={() => {
              if (!query.trim()) return;
              router.push("/legalai/research/new");
            }}
          />

          <QueryResults status={dashboardStatus} result={queryResult} heading="Research analysis" />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {sessionAuthorities.length} authorities
            </p>
            <AuthorityFilters filters={filters} onChange={setFilters} onReset={() => setFilters({})} />
          </div>

          <DashboardStateBoundary
            status={dashboardStatus}
            data={filteredSources}
            isEmpty={(list) => list.length === 0}
            label="authorities"
          >
            {(list) => (
              <SourceList
                sources={list}
                heading="Authorities & sources"
                collapsibleSnippet
                renderActions={(source) => (
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => toast.success("Saved authority")}
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant={compareIds.includes(source.id) ? "secondary" : "outline"}
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setCompareIds((prev) =>
                          prev.includes(source.id)
                            ? prev.filter((c) => c !== source.id)
                            : [...prev, source.id].slice(-2),
                        );
                      }}
                    >
                      {compareIds.includes(source.id) ? "Selected" : "Compare"}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => router.push(`/legalai/research/${id}/authorities/${source.id}`)}
                    >
                      Open
                    </Button>
                  </div>
                )}
              />
            )}
          </DashboardStateBoundary>
          <p className="sr-only" role="status" aria-live="polite">
            {filtered.length} authorities listed.
          </p>
        </div>
      </div>

      <aside className="hidden min-h-0 overflow-y-auto border-l border-border/60 lg:block">
        <div className="space-y-3 p-3">
          {queryResult?.irac?.conclusion.text ? (
            <div className="rounded-lg border border-border/60 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Conclusion
              </p>
              <p className="text-sm leading-relaxed">{queryResult.irac.conclusion.text}</p>
            </div>
          ) : null}
          <p className="px-1 text-[11px] text-muted-foreground">
            Full reasoning, artifacts, and workflow are in the Research analysis section.
          </p>
        </div>
      </aside>
    </div>
  );
}
