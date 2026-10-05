"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { EvidencePanel } from "@/components/ai/legal/evidence-panel";
import { ConfidenceIndicator } from "@/components/ai/legal/confidence";
import { cn } from "@/lib/utils";
import type { DebateEvidence, DebateSource } from "@/types/debate";
import { ChevronDown, ExternalLink, Link as LinkIcon } from "lucide-react";

/**
 * Adapter that maps `DebateEvidence[]` into the `EvidencePanel` component
 * used throughout the legal AI surface, plus a compact `DebateEvidenceCard`
 * for inline use inside `ArgumentCard`.
 */

export interface DebateEvidencePanelProps {
  evidence: DebateEvidence[];
  sources: DebateSource[];
  title?: string;
  className?: string;
}

export function DebateEvidencePanel({
  evidence,
  sources,
  title = "Evidence & Sources",
  className,
}: DebateEvidencePanelProps) {
  const allItems = [...evidence, ...sources].map((item) => ({
    title: item.title,
    url: item.url,
    court: item.court,
    jurisdiction: item.jurisdiction,
    citation: item.citation,
    date: item.date,
    excerpt: item.excerpt,
    verificationStatus: item.verificationStatus,
    confidence: item.confidence,
  }));

  return <EvidencePanel evidence={allItems} title={title} className={className} />;
}

export interface DebateEvidenceCardProps {
  evidence: DebateEvidence;
  className?: string;
}

export function DebateEvidenceCard({ evidence, className }: DebateEvidenceCardProps) {
  const strengthLabel = evidence.strength.charAt(0).toUpperCase() + evidence.strength.slice(1);
  const confidenceLevel: "high" | "medium" | "low" | "insufficient" =
    (evidence.confidence ?? 0) >= 0.8
      ? "high"
      : (evidence.confidence ?? 0) >= 0.6
        ? "medium"
        : (evidence.confidence ?? 0) >= 0.35
          ? "low"
          : "insufficient";

  return (
    <Collapsible className={cn("rounded-lg border bg-card/50", className)}>
      <CollapsibleTrigger className="flex w-full items-start gap-2.5 p-3 text-left hover:bg-muted/50 transition-colors">
        <LinkIcon className="size-3.5 mt-0.5 shrink-0 text-primary" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{evidence.title}</span>
            <Badge variant="outline" className="text-[10px]">
              {evidence.stance}
            </Badge>
            <Badge className={cn("text-[10px] border", {
              "border-emerald-500/25 bg-emerald-500/10 text-emerald-700": evidence.strength === "strong",
              "border-amber-500/25 bg-amber-500/10 text-amber-700": evidence.strength === "moderate",
              "border-orange-500/25 bg-orange-500/10 text-orange-700": evidence.strength === "weak",
              "border-muted bg-muted text-muted-foreground": evidence.strength === "unverified",
            })}>
              {strengthLabel}
            </Badge>
          </div>
          {evidence.citation ? (
            <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">{evidence.citation}</p>
          ) : null}
          {evidence.pinpoint ? (
            <p className="text-[10px] text-muted-foreground">{evidence.pinpoint}</p>
          ) : null}
        </div>
        <ChevronDown className="size-3.5 shrink-0 text-muted-foreground transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">
        <div className="space-y-2">
          {evidence.excerpt ? (
            <div className="rounded-md bg-muted/50 p-2.5 text-xs text-muted-foreground">{evidence.excerpt}</div>
          ) : null}
          <div className="flex flex-wrap items-center gap-2">
            <ConfidenceIndicator level={confidenceLevel} className="text-xs" />
            {evidence.url ? (
              <a
                href={evidence.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <ExternalLink className="size-3" /> Source
              </a>
            ) : null}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
