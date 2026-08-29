"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { IRACReasoningTimeline, type IRACAnalysis } from "./IRACReasoningTimeline";
import { DocumentArtifactsResults, type DocumentArtifact } from "./DocumentArtifactsResults";
import { AgentWorkflowExplorer } from "./AgentWorkflowExplorer";
import { Brain, FileText, Workflow } from "lucide-react";

interface QueryResultsLayoutProps {
  jobId: string;
  query: string;
  court: string;
  iracAnalysis?: IRACAnalysis;
  artifacts?: DocumentArtifact[];
  isLoadingAnalysis?: boolean;
  isLoadingArtifacts?: boolean;
}

export function QueryResultsLayout({
  jobId,
  query,
  court,
  iracAnalysis,
  artifacts = [],
  isLoadingAnalysis = false,
  isLoadingArtifacts = false,
}: QueryResultsLayoutProps) {
  return (
    <Tabs defaultValue="reasoning" className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-6">
        <TabsTrigger value="reasoning" className="flex items-center gap-2">
          <Brain className="h-4 w-4" />
          <span className="hidden sm:inline">Reasoning</span>
        </TabsTrigger>
        <TabsTrigger value="artifacts" className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span className="hidden sm:inline">Artifacts</span>
          {artifacts.length > 0 && (
            <span className="ml-1 text-xs bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 rounded-full px-2 py-0.5">
              {artifacts.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="workflow" className="flex items-center gap-2">
          <Workflow className="h-4 w-4" />
          <span className="hidden sm:inline">Workflow</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="reasoning" className="space-y-4">
        <IRACReasoningTimeline analysis={iracAnalysis} isLoading={isLoadingAnalysis} />
      </TabsContent>

      <TabsContent value="artifacts" className="space-y-4">
        <DocumentArtifactsResults artifacts={artifacts} isLoading={isLoadingArtifacts} />
      </TabsContent>

      <TabsContent value="workflow" className="space-y-4">
        <AgentWorkflowExplorer jobId={jobId} query={query} court={court} />
      </TabsContent>
    </Tabs>
  );
}
