"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Search,
  BookOpen,
  Bookmark,
  ExternalLink,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Gavel,
  FileText,
  Loader2,
  Filter,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sources,
  SourcesContent,
  SourcesTrigger,
  Source,
} from "@/components/ai-elements/sources";
import {
  InlineCitation,
  InlineCitationCard,
  InlineCitationCardTrigger,
  InlineCitationCardBody,
  InlineCitationCarousel,
  InlineCitationCarouselContent,
  InlineCitationCarouselItem,
  InlineCitationCarouselHeader,
  InlineCitationCarouselIndex,
  InlineCitationCarouselPrev,
  InlineCitationCarouselNext,
  InlineCitationSource,
  InlineCitationQuote,
} from "@/components/ai-elements/inline-citation";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from "@/components/ai-elements/chain-of-thought";
import {
  MOCK_SEARCH_RESULTS,
  MOCK_REASONING_STEPS,
  LEGAL_AREAS,
  JURISDICTIONS,
} from "@/lib/lawmate/data";
import type { SourceType } from "@/types/lawmate";
import { cn } from "@/lib/utils";

const SOURCE_TYPE_LABEL: Record<SourceType, string> = {
  act: "Act",
  regulation: "Regulation",
  case: "Case",
  guideline: "Guideline",
  government: "Government",
  other: "Other",
};

export default function ResearchPage() {
  const [query, setQuery] = useState("deductions from wages");
  const [area, setArea] = useState<string>("Employment");
  const [source, setSource] = useState<string>("all");
  const [loading, setLoading] = useState(false);

  const handleSearch = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  const results = MOCK_SEARCH_RESULTS.filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    if (area !== "all") {
      const areaLabel = LEGAL_AREAS.find((a) => a.id === area)?.label?.toLowerCase() ?? "";
      if (areaLabel && !r.source.area?.toLowerCase().includes(areaLabel)) return false;
    }
    if (source !== "all" && r.source.type !== source) return false;
    return (
      r.source.title.toLowerCase().includes(q) ||
      r.summary.toLowerCase().includes(q) ||
      (r.citation?.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Legal Research</h1>
          <p className="text-sm text-muted-foreground">
            Search across Malaysian legislation, cases, guidelines and verified
            sources.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search Malaysian employment law…"
                className="pl-10 h-11 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
              {loading && (
                <Loader2 className="absolute right-3 top-3 size-4 animate-spin text-primary" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="h-8 w-auto text-xs">
                  <Filter className="size-3" />
                  <SelectValue placeholder="Area" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All areas</SelectItem>
                  {LEGAL_AREAS.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={source} onValueChange={setSource}>
                <SelectTrigger className="h-8 w-auto text-xs">
                  <BookOpen className="size-3" />
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sources</SelectItem>
                  {(Object.keys(SOURCE_TYPE_LABEL) as SourceType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {SOURCE_TYPE_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select defaultValue="my">
                <SelectTrigger className="h-8 w-auto text-xs">
                  <SelectValue placeholder="Jurisdiction" />
                </SelectTrigger>
                <SelectContent>
                  {JURISDICTIONS.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleSearch}
                size="sm"
                className="ml-auto gap-1.5"
                disabled={loading}
              >
                <Search className="size-3.5" /> Search
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="size-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">AI research mode</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Searches authoritative sources, retrieves relevant provisions
                  and prepares a citation-checked answer.
                </p>
                <ChainOfThought defaultOpen>
                  <ChainOfThoughtHeader>Search status</ChainOfThoughtHeader>
                  <ChainOfThoughtContent>
                    {MOCK_REASONING_STEPS.map((s) => (
                      <ChainOfThoughtStep
                        key={s.id}
                        icon={
                          s.status === "complete"
                            ? CheckCircle2
                            : s.status === "running"
                            ? Sparkles
                            : AlertCircle
                        }
                        label={s.label}
                        description={s.detail}
                        status={
                          s.status === "complete"
                            ? "complete"
                            : s.status === "running"
                            ? "active"
                            : "pending"
                        }
                      />
                    ))}
                  </ChainOfThoughtContent>
                </ChainOfThought>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              {results.length} results · sorted by relevance
            </p>
            {results.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No results for &ldquo;{query}&rdquo;. Try a broader query or change the filters.
                </CardContent>
              </Card>
            )}
            {results.map((r) => {
              const s = r.source;
              return (
                <Card key={s.id} className="hover:border-primary/30 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        {s.type === "act" ? (
                          <BookOpen className="size-4 text-muted-foreground" />
                        ) : s.type === "case" ? (
                          <Gavel className="size-4 text-muted-foreground" />
                        ) : (
                          <FileText className="size-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium leading-tight">{s.title}</p>
                          <Badge variant="outline" className="text-[10px]">
                            {SOURCE_TYPE_LABEL[s.type]}
                          </Badge>
                          {s.section && (
                            <Badge variant="secondary" className="text-[10px]">
                              {s.section}
                            </Badge>
                          )}
                          {s.verified && (
                            <Badge
                              variant="outline"
                              className="text-[10px] gap-1 border-emerald-500/30 text-emerald-500"
                            >
                              <CheckCircle2 className="size-3" /> Verified
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {s.authority}
                          {s.section && ` · ${s.section}`}
                          {r.date && ` · ${r.date}`}
                          {" · "}
                          Relevance {(r.relevance * 100).toFixed(0)}%
                        </p>
                        <p className="mt-2 text-sm leading-relaxed">{r.summary}</p>
                        <p className="mt-2 text-[11px] font-mono text-muted-foreground">
                          {r.citation}
                        </p>

                        <InlineCitation className="mt-2">
                          <InlineCitationCard>
                            <InlineCitationCardTrigger
                              sources={[s.url ?? s.title]}
                              className="bg-primary/10 text-primary border-primary/20"
                            >
                              View source
                            </InlineCitationCardTrigger>
                            <InlineCitationCardBody>
                              <InlineCitationCarousel>
                                <InlineCitationCarouselContent>
                                  <InlineCitationCarouselItem>
                                    <InlineCitationCarouselHeader>
                                      <Badge variant="secondary" className="text-[10px]">
                                        {s.type}
                                      </Badge>
                                      <InlineCitationCarouselPrev />
                                      <InlineCitationCarouselIndex />
                                      <InlineCitationCarouselNext />
                                    </InlineCitationCarouselHeader>
                                    <InlineCitationSource
                                      title={s.title}
                                      url={s.url}
                                      description={s.excerpt}
                                    />
                                    {s.excerpt && (
                                      <InlineCitationQuote>{s.excerpt}</InlineCitationQuote>
                                    )}
                                  </InlineCitationCarouselItem>
                                </InlineCitationCarouselContent>
                              </InlineCitationCarousel>
                            </InlineCitationCardBody>
                          </InlineCitationCard>
                        </InlineCitation>
                      </div>
                      <div className="flex flex-col gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Save"
                          onClick={() =>
                            toast.success(`Saved "${s.title}"`, {
                              description: "Open Saved Items to view it later.",
                            })
                          }
                        >
                          <Bookmark className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Open"
                          onClick={() => {
                            if (s.url) window.open(s.url, "_blank", "noopener,noreferrer");
                            else toast.info("Source URL not available for this result");
                          }}
                          disabled={!s.url}
                        >
                          <ExternalLink className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card className="self-start lg:sticky lg:top-20">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Sparkles className="size-4 text-primary" /> AI Research Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Direct answer
                </p>
                <p className="text-sm leading-relaxed">
                  Deductions from wages in Malaysia are limited to those
                  authorised in writing under Section 24 of the Employment Act
                  1955. Disciplinary fines are not permissible.
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Verified sources
                </p>
                <Sources>
                  <SourcesTrigger count={results.length} />
                  <SourcesContent>
                    {results.map((r) => (
                      <Source key={r.source.id} href={r.source.url} title={r.citation} />
                    ))}
                  </SourcesContent>
                </Sources>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Practical implications
                </p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  <li>· Employers should retain signed authorisation.</li>
                  <li>· Itemise deductions in payslips.</li>
                  <li>· Verify current Employment Act provisions.</li>
                </ul>
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  Recommended next steps
                </p>
                <ol className="space-y-1 text-xs text-muted-foreground list-decimal pl-4">
                  <li>Confirm the latest Employment Act amendment status.</li>
                  <li>Compare with the deduction regulations.</li>
                  <li>Draft a compliant deduction authorisation clause.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}