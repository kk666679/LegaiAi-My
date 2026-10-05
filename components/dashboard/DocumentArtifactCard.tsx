"use client";

/**
 * Document artifact card.
 *
 * Purpose
 * -------
 * Renders any generated deliverable — summaries, legal memos, extracted
 * clauses, issue lists, timelines, citation lists, key findings, risk analyses
 * and drafts — with the same header, preview, provenance and action set.
 *
 * Props
 * -----
 * `artifact`        `DocumentArtifact` (see `types.ts`).
 * `sources`         Optional registry used to resolve `artifact.citations`.
 * `onSave`          Omit to hide Save — the card never invents a persistence
 *                   call it has not been given.
 * `onRegenerate`    Shown when `artifact.canRegenerate` is true; the handler is
 *                   owned by the caller so regeneration re-runs the real agent.
 * `onExport`        Overrides the built-in text/Markdown download.
 * `isSaving` / `isRegenerating`
 *                   Reflect in-flight state so the buttons can disable and
 *                   announce progress instead of firing twice.
 *
 * States
 * ------
 * `pending` / `generating` → skeleton preview, actions disabled.
 * `error`                 → failure message; regenerate offered when possible.
 * `partial`               → partial notice above the available content.
 * `complete`              → full card.
 */

import { useState } from "react";
import {
  AlertTriangle,
  BookmarkPlus,
  BookmarkCheck,
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

import { copyToClipboard, cn } from "@/lib/utils";

import { ConfidenceIndicator } from "@/components/dashboard/Indicators";
import { CitationList } from "@/components/dashboard/SourceList";
import { PartialDataNotice } from "@/components/dashboard/DashboardState";
import type { DocumentArtifact, Source } from "@/components/dashboard/types";
import { ARTIFACT_STATUS_LABELS, ARTIFACT_TYPE_LABELS } from "@/components/dashboard/types";
import { downloadArtifact } from "@/components/dashboard/export";
import { countWords, formatDateTime, formatList } from "@/components/dashboard/format";

const STATUS_TONES: Record<
  DocumentArtifact["status"],
  { className: string; dot: string }
> = {
  pending: {
    className: "border-border bg-muted text-muted-foreground",
    dot: "bg-muted-foreground",
  },
  generating: {
    className: "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
  },
  complete: {
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    dot: "bg-emerald-500",
  },
  partial: {
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
  },
  error: {
    className: "border-red-500/30 bg-red-500/10 text-red-600 dark:text-red-400",
    dot: "bg-red-500",
  },
};

export interface DocumentArtifactCardProps {
  artifact: DocumentArtifact;
  /** Registry backing `artifact.citations`. */
  citationSources?: readonly Source[];
  onSave?: (artifact: DocumentArtifact) => void;
  onRegenerate?: (artifact: DocumentArtifact) => void;
  onExport?: (artifact: DocumentArtifact) => void;
  isSaving?: boolean;
  isRegenerating?: boolean;
  className?: string;
}

export function DocumentArtifactCard({
  artifact,
  citationSources,
  onSave,
  onRegenerate,
  onExport,
  isSaving = false,
  isRegenerating = false,
  className,
}: DocumentArtifactCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const tone = STATUS_TONES[artifact.status];
  const inFlight =
    artifact.status === "pending" || artifact.status === "generating";
  const canRender = artifact.status === "complete" || artifact.status === "partial";
  const words = artifact.wordCount ?? countWords(artifact.content);
  const longContent = artifact.content.length > 700;
  const sourceDocuments = artifact.sourceDocuments ?? [];

  const handleCopy = async () => {
    await copyToClipboard(artifact.content);
    setCopied(true);
    toast.success("Artifact copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (onExport) {
      onExport(artifact);
      return;
    }
    const ok = downloadArtifact(artifact);
    if (!ok) {
      toast.error("Download is unavailable in this browser");
      return;
    }
    toast.success("Artifact downloaded");
  };

  const handleRegenerate = () => {
    if (!onRegenerate) {
      toast.info("Regeneration is not available for this artifact");
      return;
    }
    onRegenerate(artifact);
  };

  return (
    <article
      className={cn("flex flex-col gap-3 rounded-lg border bg-card/40 p-3", className)}
      aria-labelledby={`artifact-${artifact.id}-title`}
      aria-busy={inFlight || isRegenerating}
    >
      <header className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-start gap-2">
          <span
            aria-hidden
            className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-md bg-muted"
          >
            <FileText className="size-3.5 text-muted-foreground" />
          </span>
          <div className="min-w-0 flex-1">
            <h3
              id={`artifact-${artifact.id}-title`}
              className="truncate text-sm font-medium"
            >
              {artifact.title}
            </h3>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {ARTIFACT_TYPE_LABELS[artifact.type]}
              {" · "}
              {formatDateTime(artifact.generatedAt)}
              {words > 0 ? ` · ${words.toLocaleString("en-MY")} words` : ""}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Badge variant="outline" className={cn("gap-1 text-[10px]", tone.className)}>
            <span aria-hidden className={cn("size-1.5 rounded-full", tone.dot)} />
            {inFlight && <Loader2 className="size-3 animate-spin" aria-hidden />}
            {ARTIFACT_STATUS_LABELS[artifact.status]}
          </Badge>

          <div className="flex items-center gap-0.5">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={!canRender}
              onClick={handleCopy}
              aria-label={`Copy ${artifact.title}`}
            >
              {copied ? (
                <Check aria-hidden className="text-emerald-500" />
              ) : (
                <Copy aria-hidden />
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-8"
                  disabled={!canRender}
                  aria-label={`More actions for ${artifact.title}`}
                >
                  <MoreHorizontal aria-hidden />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>Artifact actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={handleCopy}>
                  <Copy aria-hidden />
                  Copy content
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDownload}>
                  <Download aria-hidden />
                  Download / export
                </DropdownMenuItem>
                {onSave ? (
                  <DropdownMenuItem
                    disabled={isSaving}
                    onSelect={() => onSave(artifact)}
                  >
                    {artifact.isSaved ? (
                      <BookmarkCheck aria-hidden />
                    ) : (
                      <BookmarkPlus aria-hidden />
                    )}
                    {artifact.isSaved ? "Update saved copy" : "Save to research"}
                  </DropdownMenuItem>
                ) : null}
                {artifact.canRegenerate ? (
                  <DropdownMenuItem
                    disabled={isRegenerating}
                    onSelect={handleRegenerate}
                  >
                    {isRegenerating ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden />
                    ) : (
                      <RefreshCw aria-hidden />
                    )}
                    Regenerate
                  </DropdownMenuItem>
                ) : null}
                {sourceDocuments.some((document) => document.href) ? (
                  <>
                    <DropdownMenuSeparator />
                    {sourceDocuments
                      .filter(
                        (document): document is typeof document & { href: string } =>
                          Boolean(document.href),
                      )
                      .slice(0, 4)
                      .map((document) => (
                        <DropdownMenuItem key={document.id} asChild>
                          <a href={document.href}>
                            <ExternalLink aria-hidden />
                            <span className="truncate">{document.title}</span>
                          </a>
                        </DropdownMenuItem>
                      ))}
                  </>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {artifact.status === "error" ? (
        <div
          role="alert"
          className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs"
        >
          <p className="flex items-center gap-1.5 font-medium text-red-600 dark:text-red-400">
            <AlertTriangle className="size-3.5" aria-hidden />
            Generation failed
          </p>
          <p className="mt-1 text-muted-foreground">
            {artifact.error ?? "The artifact could not be generated."}
          </p>
          {artifact.canRegenerate ? (
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              disabled={isRegenerating}
              onClick={handleRegenerate}
            >
              <RefreshCw aria-hidden />
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {artifact.status === "partial" ? (
        <PartialDataNotice message="Partial artifact — some sections could not be produced." />
      ) : null}

      {inFlight ? (
        <div className="space-y-2" aria-hidden>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-5/6" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ) : canRender && artifact.content ? (
        <div className="space-y-1">
          <div
            style={!expanded && longContent ? { maxHeight: 240 } : undefined}
            className={cn(
              "overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground",
              !expanded && longContent && "pr-1",
            )}
          >
            {artifact.content}
          </div>
          {longContent ? (
            <Button
              size="sm"
              variant="ghost"
              className="h-7 px-1.5 text-xs"
              aria-expanded={expanded}
              onClick={() => setExpanded((value) => !value)}
            >
              {expanded ? "Show preview" : "Read full artifact"}
            </Button>
          ) : null}
        </div>
      ) : null}

      {sourceDocuments.length > 0 ? (
        <p className="text-[11px] text-muted-foreground">
          Derived from {formatList(sourceDocuments.map((document) => document.title))}
        </p>
      ) : null}

      {artifact.citations && artifact.citations.length > 0 ? (
        <CitationList
          citations={artifact.citations}
          sources={citationSources}
          title="Citations"
          className="border-t pt-3"
        />
      ) : null}

      {artifact.confidence !== undefined ? (
        <ConfidenceIndicator
          value={artifact.confidence}
          label="Artifact confidence"
          className="border-t pt-3"
        />
      ) : null}
    </article>
  );
}