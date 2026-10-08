"use client";
// app/lawmate/research/_components/research-memo.tsx
import * as React from "react";
import Link from "next/link";
import { Copy, Download, FileText, Save, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useResearch } from "./use-research";
import { DocumentArtifactsResults } from "@/components/dashboard/DocumentArtifactsResults";
import { DashboardStateBoundary } from "@/components/dashboard/DashboardState";
import {
  toDashboardArtifacts,
  toDashboardCitations,
  toDashboardSources,
  toDashboardStatus,
} from "./lawmate-dashboard-adapters";

export function ResearchMemoPage({ id }: { id: string }) {
  const { activeSession, sessionMemo, sessionAuthorities, updateMemo } = useResearch({ sessionId: id });
  const [body, setBody] = React.useState(sessionMemo?.body ?? "");
  const [title, setTitle] = React.useState(sessionMemo?.title ?? "Untitled memo");
  const [status, setStatus] = React.useState<"draft" | "review" | "final">(sessionMemo?.status ?? "draft");

  React.useEffect(() => {
    if (sessionMemo) {
      setBody(sessionMemo.body);
      setTitle(sessionMemo.title);
      setStatus(sessionMemo.status);
    }
  }, [sessionMemo]);

  if (!sessionMemo) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <FileText className="mx-auto size-6 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium">No memo yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Review this session&apos;s findings before preparing a memo.
          </p>
          <Button asChild size="sm" className="mt-4 gap-1.5">
            <Link href={`/lawmate/research/${encodeURIComponent(id)}/results`}>
              <Sparkles className="size-3.5" /> Review findings
            </Link>
          </Button>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    updateMemo(id, { title, body, status });
    toast.success("Memo saved");
  };

  const handleCopy = () => {
    void navigator.clipboard.writeText(body);
    toast.success("Copied to clipboard");
  };

  const memoStatus = activeSession ? toDashboardStatus(activeSession.status) : "loading";
  const memoSources = toDashboardSources(sessionAuthorities);
  const memoCitations = toDashboardCitations(sessionAuthorities);
  const memoArtifacts = toDashboardArtifacts(sessionMemo, memoCitations, activeSession?.avgConfidence ?? undefined);

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border-0 bg-transparent px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
            aria-label="Memo title"
          />
          <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
            <span>Last updated {new Date(sessionMemo.updatedAt).toLocaleString()}</span>
            {sessionMemo.authorName ? <span>· {sessionMemo.authorName}</span> : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="final">Final</SelectItem>
            </SelectContent>
          </Select>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={handleCopy}>
            <Copy className="size-3.5" /> Copy
          </Button>
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.print()}>
            <Download className="size-3.5" /> PDF
          </Button>
          <Button size="sm" className="gap-1.5" onClick={handleSave}>
            <Save className="size-3.5" /> Save
          </Button>
        </div>
      </header>

      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] capitalize">{status}</Badge>
        <Badge variant="outline" className="text-[10px]">Markdown</Badge>
      </div>

      <Card className="p-0">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="min-h-[560px] resize-none border-0 bg-transparent p-6 font-serif text-sm leading-relaxed shadow-none focus-visible:ring-0"
          aria-label="Memo body"
        />
      </Card>

      <DashboardStateBoundary status={memoStatus} data={memoArtifacts} isEmpty={(list) => list.length === 0} label="generated artifacts">
        {(list) => (
          <DocumentArtifactsResults
            status={memoStatus}
            artifacts={list}
            sources={memoSources}
            groupByType={false}
            heading="Generated artifact"
            onExport={() => window.print()}
          />
        )}
      </DashboardStateBoundary>
    </div>
  );
}
