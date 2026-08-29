"use client";

import { Agent, AgentHeader, AgentContent, AgentInstructions } from "@/components/ai-elements/agent";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ai-elements/sources";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import { useMemo } from "react";

interface PipelineStep {
  key: string;
  title: string;
  state: Parameters<typeof ToolHeader>[0]["state"];
  input: Record<string, unknown>;
  output: Record<string, unknown> | string;
  duration?: number;
  description?: string;
}

interface AgentWorkflowExplorerProps {
  jobId: string;
  query: string;
  court: string;
  steps?: PipelineStep[];
}

const defaultSteps: PipelineStep[] = [
  {
    key: "retrieval",
    title: "Retrieval (RAG)",
    description: "Fetching relevant case law and statutes",
    state: "output-available",
    duration: 2.3,
    input: { query: "Writ of mandamus requirements", court: "Federal Court", limit: 10 },
    output: {
      cases: ["Federal Court: Ahmad v. SSM (2015)", "High Court: Wong v. Syarikat (2018)"],
      documentsRetrieved: 12,
      totalTokens: 4523,
    },
  },
  {
    key: "analysis",
    title: "Analysis (IRAC)",
    description: "Applying legal reasoning framework",
    state: "output-available",
    duration: 3.1,
    input: { method: "IRAC", context: "Retrieved 12 legal precedents" },
    output: {
      issue: "Whether writ of mandamus is available against SSM decision",
      law: "Constitution Article 128, Rules of High Court 1980, Order 53",
      analysis: "Public law remedy available when agency acts ultra vires",
    },
  },
  {
    key: "drafting",
    title: "Drafting",
    description: "Generating legal document",
    state: "input-available",
    duration: 1.8,
    input: { documentType: "Legal Opinion", tone: "Formal", includeHeadings: true },
    output: "Draft legal opinion generated (2,341 words).",
  },
  {
    key: "validation",
    title: "Validation & Audit",
    description: "Checking citations and legal consistency",
    state: "input-streaming",
    input: { checks: ["Citation accuracy", "Legal consistency", "PDPA compliance"] },
    output: "Validation in progress...",
  },
];

export function AgentWorkflowExplorer({
  jobId,
  query,
  court,
  steps = defaultSteps,
}: AgentWorkflowExplorerProps) {
  const completedSteps = useMemo(
    () => steps.filter((s) => s.state === "output-available").length,
    [steps]
  );
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <Card className="h-full border flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">Workflow Explorer</span>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {completedSteps} of {steps.length} stages complete
            </p>
          </div>
          <Badge variant="secondary" className="font-mono flex-shrink-0">
            #{jobId.slice(-6)}
          </Badge>
        </div>
        <div className="mt-3">
          <Progress value={progressPercent} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col overflow-hidden space-y-4">
        <Agent className="border rounded-lg">
          <AgentHeader name="Law Mate Orchestrator" model="legal-orchestrate" />
          <AgentContent>
            <AgentInstructions>
              Real-time pipeline execution. Expand each tool to inspect inputs, outputs, and processing time.
            </AgentInstructions>
            <div className="space-y-2 mt-3">
              <div className="rounded-lg bg-muted/50 p-3 border border-muted text-sm space-y-2">
                <div>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground block">Query</span>
                  <p className="text-sm font-medium line-clamp-2">{query}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">Court: {court}</Badge>
                  <Badge variant="outline" className="text-xs">Trace: {jobId.slice(-8)}</Badge>
                </div>
              </div>
            </div>
          </AgentContent>
        </Agent>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-3">
            {steps.map((step, idx) => (
              <Tool key={step.key} className="rounded-lg border overflow-hidden">
                <ToolHeader
                  title={step.title}
                  type={`tool-${step.key}`}

                  state={step.state}
                  className="py-2.5"
                />
                <ToolContent className="space-y-3 p-3">
                  {step.description && (
                    <p className="text-xs text-muted-foreground italic">{step.description}</p>
                  )}
                  <ToolInput input={step.input} />
                  <ToolOutput output={step.output} errorText={""} />
                  {step.duration && (
                    <div className="flex items-center justify-end text-xs text-muted-foreground">
                      ⏱️ {step.duration}s
                    </div>
                  )}
                </ToolContent>
              </Tool>
            ))}
          </div>
        </ScrollArea>

        <div className="pt-3 border-t">
          <Sources>
            <SourcesTrigger count={3} />
            <SourcesContent className="space-y-2 mt-2">
              <Source href="#" title="Federal Constitution" />
              <Source href="#" title="Contracts Act 1950" />
              <Source href="#" title="Case law: Ahmad v. SSM" />
            </SourcesContent>
          </Sources>
        </div>
      </CardContent>
    </Card>
  );
}
