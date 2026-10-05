"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from "@/components/ui/empty";
import { AILiveBadge } from "@/components/ai/ailive-badge";
import { DebateEvidencePanel } from "../evidence/debate-evidence-panel";
import { cn } from "@/lib/utils";
import type { DebateEntry, DebateEvidence, DebateRound, DebateSource } from "@/types/debate";
import { DEBATE_ENTRY_LABELS, DEBATE_SIDE_LABELS } from "@/types/debate";
import { ParticipantAvatar } from "../participants/participant-card";
import { ParticipantKindBadge, ParticipantStatus } from "../participants/participant-status";
import { Copy, Download, Search } from "lucide-react";

export interface DebateTranscriptProps {
  entries: DebateEntry[];
  rounds: DebateRound[];
  evidence?: DebateEvidence[];
  sources?: DebateSource[];
  className?: string;
}

const STREAMING_CLS = "border-primary/40 animate-pulse bg-primary/5";

export function DebateTranscript({
  entries,
  rounds,
  evidence = [],
  sources = [],
  className,
}: DebateTranscriptProps) {
  const [query, setQuery] = useState("");
  const [activeRoundId, setActiveRoundId] = useState<string | null>(null);
  const [showOnlySimulated, setShowOnlySimulated] = useState(false);

  const roundLabels = useMemo(() => {
    const map: Record<string, string> = {};
    rounds.forEach((r) => {
      map[r.id] = r.title ?? r.type ?? `Round ${r.index}`;
    });
    return map;
  }, [rounds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (activeRoundId && entry.roundId !== activeRoundId) return false;
      if (showOnlySimulated && !entry.generatedByAi) return false;
      if (!q) return true;
      const haystack = `${entry.content} ${entry.kind} ${roundLabels[entry.roundId] ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeRoundId, entries, query, roundLabels, showOnlySimulated]);

  const copyText = useMemo(() => {
    const lines = filtered.map((entry) => {
      const when = entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : "";
      const label = `${when} — ${entry.kind}: ${entry.content}`;
      return label;
    });
    return lines.join("\n\n");
  }, [filtered]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      // noop
    }
  };

  const handleExport = () => {
    const blob = new Blob([copyText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "debate-transcript.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const roundFilterOptions = useMemo(() => {
    const map = new Map<string, string>();
    rounds.forEach((r) => map.set(r.id, r.title ?? r.type ?? `Round ${r.index}`));
    return Array.from(map.entries());
  }, [rounds]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      <div className="space-y-2 border-b pb-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-sm font-semibold">Transcript</span>
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleCopy}>
              <Copy className="size-3" /> Copy
            </Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1 text-xs" onClick={handleExport}>
              <Download className="size-3" /> Export
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search transcript..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          <select
            value={activeRoundId ?? ""}
            onChange={(e) => setActiveRoundId(e.target.value || null)}
            className="h-8 rounded-md border bg-background px-2 text-xs"
          >
            <option value="">All rounds</option>
            {roundFilterOptions.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={showOnlySimulated}
              onChange={(e) => setShowOnlySimulated(e.target.checked)}
              className="size-3.5"
            />
            AI entries
          </label>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-2 p-3">
          {filtered.map((entry) => {
            const entryEvidence = entry.evidenceIds
              ?.map((id) => evidence.find((e) => e.id === id))
              .filter(Boolean) as DebateEvidence[] | undefined;
            const entrySources = entry.sources ?? [];
            const isStreaming = entry.streaming;

            return (
              <div
                key={entry.id}
                id={`entry-${entry.id}`}
                className={cn("rounded-lg border bg-card/50 p-3 transition-colors", isStreaming && STREAMING_CLS)}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <ParticipantAvatar
                    participant={{
                      name: entry.participantId,
                      initials: entry.participantId.slice(0, 2).toUpperCase(),
                      type: entry.role,
                    }}
                    className="size-6"
                  />
                  <span className="text-xs font-medium">{entry.participantId}</span>
                  <ParticipantKindBadge participant={{ type: entry.role, side: entry.side }} />
                  {isStreaming ? (
                    <AILiveBadge status="active" size="sm" showLabel={false} />
                  ) : null}
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ""}
                  </span>
                </div>

                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  <Badge variant="outline" className="text-[10px]">
                    {DEBATE_ENTRY_LABELS[entry.kind] ?? entry.kind}
                  </Badge>
                  {entry.confidence !== undefined ? (
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round((entry.confidence ?? 0) * 100)}%
                    </span>
                  ) : null}
                  {entry.generatedByAi ? (
                    <Badge variant="secondary" className="text-[10px]">
                      AI
                    </Badge>
                  ) : null}
                </div>

                <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>

                {entry.citations && entry.citations.length > 0 ? (
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {entry.citations.map((cit) => (
                      <Badge key={cit.id} variant="secondary" className="font-mono text-[10px]">
                        {cit.label}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                {entryEvidence && entryEvidence.length > 0 ? (
                  <div className="mt-2">
                    <DebateEvidencePanel evidence={entryEvidence} sources={entrySources} />
                  </div>
                ) : null}
              </div>
            );
          })}

          {filtered.length === 0 ? (
            <Empty className="py-10">
              <EmptyHeader>
                <EmptyTitle>No entries</EmptyTitle>
                <EmptyDescription>Adjust the filters or start a debate.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Legacy `Transcript` for callers that still pass `rounds: DebateTurn[]`.
 * It uses the `turnsToEntries` migration helper to bridge into the new model.
 */
import type { DebateTurn, DebateRole } from "@/types/debate";
import { turnsToEntries } from "@/types/debate";

export interface TranscriptProps {
  rounds: DebateTurn[];
}

export function Transcript({ rounds }: TranscriptProps) {
  const entries = turnsToEntries(rounds);
  const roundLabels = new Map(rounds.map((r) => [`round-${r.roundNum}`, `Round ${r.roundNum}`]));
  return (
    <div className="space-y-3">
      {entries.map((entry) => {
        const label = roundLabels.get(entry.roundId) ?? entry.roundId;
        return (
          <div key={entry.id} className="rounded-lg border bg-card/50 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">{label}</span>
              <span>·</span>
              <span>{entry.role}</span>
              <span>·</span>
              <span>{entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ""}</span>
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{entry.content}</p>
          </div>
        );
      })}
      {entries.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">Start a debate to see the transcript.</p>
      ) : null}
    </div>
  );
}
