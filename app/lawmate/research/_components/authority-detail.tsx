"use client";
// app/legalai/research/_components/authority-detail.tsx
import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bookmark, ExternalLink, Quote, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { SourceCard } from "@/components/dashboard/SourceCard";
import { CitationList } from "@/components/dashboard/SourceList";
import { useResearch } from "./use-research";
import { toDashboardCitations, toDashboardSource } from "./legalai-dashboard-adapters";

export function AuthorityDetailPage({
  sessionId,
  authorityId,
}: {
  sessionId: string;
  authorityId: string;
}) {
  const router = useRouter();
  const { sessionAuthorities } = useResearch({ sessionId });
  const authority = sessionAuthorities.find((a) => a.id === authorityId);

  const dashboardSource = React.useMemo(
    () => (authority ? toDashboardSource(authority) : null),
    [authority],
  );
  const dashboardCitations = React.useMemo(
    () => (authority ? toDashboardCitations([authority]) : []),
    [authority],
  );

  if (!authority || !dashboardSource) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted-foreground">Authority not found.</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => router.back()}>
          <ArrowLeft className="mr-1.5 size-3.5" /> Back
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-3xl px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            aria-label="Back to results"
            onClick={() => router.push(`/legalai/research/${sessionId}/results`)}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">Back to results</span>
        </div>

        <header className="space-y-3">
          <SourceCard
            source={dashboardSource}
            collapsibleSnippet={false}
            actions={
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => toast.success("Saved to library")}
                >
                  <Bookmark className="size-3.5" /> Save
                </Button>
                {authority.url ? (
                  <Button size="sm" variant="ghost" className="gap-1.5" asChild>
                    <a href={authority.url} target="_blank" rel="noreferrer">
                      <ExternalLink className="size-3.5" /> Open source
                    </a>
                  </Button>
                ) : null}
              </div>
            }
          />

          {authority.judge || authority.bench?.length ? (
            <p className="text-xs text-muted-foreground">
              {authority.judge ? `Judgment by ${authority.judge}` : null}
              {authority.bench?.length ? ` · Bench: ${authority.bench.join(", ")}` : null}
            </p>
          ) : null}
        </header>

        <div className="mt-4">
          <CitationList
            citations={dashboardCitations}
            sources={[dashboardSource]}
            title="Citation"
          />
        </div>

        <Separator className="my-5" />

        {authority.rationale ? (
          <Card className="mb-4 border-primary/30 bg-primary/5 p-4">
            <div className="flex items-start gap-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  Why LegAI retrieved this
                </p>
                <p className="mt-1 text-sm">{authority.rationale}</p>
              </div>
            </div>
          </Card>
        ) : null}

        {authority.summary ? (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Summary
            </h2>
            <p className="text-sm leading-relaxed">{authority.summary}</p>
          </section>
        ) : null}

        {authority.headnote ? (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Headnote
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{authority.headnote}</p>
          </section>
        ) : null}

        {authority.keyParagraphs?.length ? (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Key paragraphs
            </h2>
            <ul className="space-y-3">
              {authority.keyParagraphs.map((p) => (
                <li key={p.para} className="rounded-md border border-border/60 p-3">
                  <div className="mb-1 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      [¶{p.para}]
                    </Badge>
                    <span className="text-xs font-medium">{p.note}</span>
                  </div>
                  <blockquote className="border-l-2 border-primary/40 pl-3 text-sm italic">
                    {p.text}
                  </blockquote>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {authority.tags?.length ? (
          <section className="mb-6">
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Tags
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {authority.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-[10px]">
                  {t}
                </Badge>
              ))}
            </div>
          </section>
        ) : null}

        {authority.cites?.length || authority.citedBy?.length ? (
          <section>
            <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Citation network
            </h2>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {authority.cites?.length ? (
                <Card className="p-3">
                  <p className="mb-2 text-[11px] font-medium">Cites</p>
                  <ul className="space-y-1 text-xs">
                    {authority.cites.map((c) => (
                      <li key={c} className="flex items-start gap-1.5">
                        <Quote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                        <span className="font-mono">{c}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}

              {authority.citedBy?.length ? (
                <Card className="p-3">
                  <p className="mb-2 text-[11px] font-medium">Cited by</p>
                  <ul className="space-y-1 text-xs">
                    {authority.citedBy.map((c) => (
                      <li key={c} className="flex items-start gap-1.5">
                        <Quote className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                        <span className="font-mono">{c}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}