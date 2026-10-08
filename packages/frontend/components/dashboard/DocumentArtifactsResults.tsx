/**
 * Artifact collection view.
 *
 * Purpose
 * -------
 * Lists every artifact produced for a query, grouped by type and filtered by
 * status. Loading, empty, error and partial handling is delegated to
 * `DashboardStateBoundary` so this component only decides layout and grouping.
 *
 * @example
 * ```tsx
 * <DocumentArtifactsResults
 *   status={status}
 *   artifacts={result?.artifacts}
 *   sources={result?.sources}
 *   onRegenerate={regenerate}
 * />
 * ```
 *
 * @example Development-only fixture (never shipped as data):
 * ```tsx
 * // app/dev/artifacts-preview/page.tsx
 * <DocumentArtifactsResults status="success" artifacts={FIXTURES} />
 * ```
 */

import { useMemo } from "react";
import { FileText, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";

import {
  CardListSkeleton,
  DashboardStateBoundary,
} from "@/components/dashboard/DashboardState";
import { DocumentErrorState } from "@/components/dashboard/DashboardErrorStates";
import { DocumentArtifactCard } from "@/components/dashboard/DocumentArtifactCard";
import type {
  DashboardStatus,
  DocumentArtifact,
  Source,
} from "@/components/dashboard/types";
import { ARTIFACT_TYPE_LABELS } from "@/components/dashboard/types";
import { formatList } from "@/components/dashboard/format";
import { cn } from "@/lib/utils";

export interface DocumentArtifactsResultsProps {
  /** Lifecycle of `artifacts`. */
  status?: DashboardStatus;
  artifacts?: readonly DocumentArtifact[];
  /** Registry used to resolve artifact citations. */
  sources?: readonly Source[];
  /** Group artifacts under a heading per type. Default `true`. */
  groupByType?: boolean;
  onSave?: (artifact: DocumentArtifact) => void;
  onRegenerate?: (artifact: DocumentArtifact) => void;
  onExport?: (artifact: DocumentArtifact) => void;
  isSaving?: boolean;
  isRegenerating?: boolean;
  error?: { message?: string | undefined } | string | null;
  onRetry?: () => void;
  heading?: string;
  className?: string;
}

export function DocumentArtifactsResults({
  status = "success",
  artifacts = [],
  sources,
  groupByType = true,
  onSave,
  onRegenerate,
  onExport,
  isSaving,
  isRegenerating,
  error,
  onRetry,
  heading = "Results & artifacts",
  className,
}: DocumentArtifactsResultsProps) {
  const groups = useMemo(() => {
    if (!groupByType) return null;
    const byType = new Map<DocumentArtifact["type"], DocumentArtifact[]>();
    for (const artifact of artifacts) {
      const bucket = byType.get(artifact.type);
      if (bucket) bucket.push(artifact);
      else byType.set(artifact.type, [artifact]);
    }
    return [...byType.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [artifacts, groupByType]);

  return (
    <section className={cn("space-y-3", className)} aria-label={heading}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-medium">
          <Layers className="size-4 shrink-0" aria-hidden />
          {heading}
        </h2>
        {artifacts.length > 0 ? (
          <Badge variant="outline" className="text-[10px]">
            {artifacts.length} artifact{artifacts.length === 1 ? "" : "s"}
          </Badge>
        ) : null}
      </div>

      <DashboardStateBoundary
        status={status}
        data={artifacts}
        error={error}
        label="artifacts"
        isEmpty={(list) => list.length === 0}
        loading={<CardListSkeleton count={3} />}
        empty={
          <EmptyState
            icon={FileText}
            title="No artifacts yet"
            description="Summaries, memoranda, extracted clauses, issue lists, timelines, findings, risk analyses and drafts appear here once the agents finish generating them."
          />
        }
        errorFallback={<DocumentErrorState error={error} onRetry={onRetry} />}
      >
        {(list) =>
          groups
            ? groups.map(([type, items]) => (
                <div key={type} className="space-y-2">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {ARTIFACT_TYPE_LABELS[type]}
                    <span className="ml-1.5 font-normal normal-case">
                      ({items.length})
                    </span>
                  </h3>
                  <div className="grid gap-2 lg:grid-cols-2">
                    {items.map((artifact) => (
                      <DocumentArtifactCard
                        key={artifact.id}
                        artifact={artifact}
                        citationSources={sources}
                        onSave={onSave}
                        onRegenerate={onRegenerate}
                        onExport={onExport}
                        isSaving={isSaving}
                        isRegenerating={isRegenerating}
                      />
                    ))}
                  </div>
                </div>
              ))
            : (
                <div className="grid gap-2 lg:grid-cols-2">
                  {list.map((artifact) => (
                    <DocumentArtifactCard
                      key={artifact.id}
                      artifact={artifact}
                      citationSources={sources}
                      onSave={onSave}
                      onRegenerate={onRegenerate}
                      onExport={onExport}
                      isSaving={isSaving}
                      isRegenerating={isRegenerating}
                    />
                  ))}
                </div>
              )
        }
      </DashboardStateBoundary>

      {artifacts.length > 0 && sources && sources.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Provenance: {formatList(sources.slice(0, 3).map((source) => source.citation ?? source.title))}
          {sources.length > 3 ? ` and ${sources.length - 3} more` : ""}
        </p>
      ) : null}
    </section>
  );
}