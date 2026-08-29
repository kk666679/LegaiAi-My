"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
  ChainOfThoughtSearchResults,
  ChainOfThoughtSearchResult,
} from "@/components/ai-elements/chain-of-thought";
import { Sources, SourcesTrigger, SourcesContent, Source } from "@/components/ai-elements/sources";
import { FileText, Scale, BookOpen, CheckCircle } from "lucide-react";

export interface IRACAnalysis {
  issue: string;
  law: string;
  analysis: string;
  conclusion: string;
  sources: Array<{ title: string; citation: string; href?: string }>;
  confidence: number;
}

interface IRACReasoningTimelineProps {
  analysis?: IRACAnalysis;
  isLoading?: boolean;
}

export function IRACReasoningTimeline({ analysis, isLoading = false }: IRACReasoningTimelineProps) {
  if (!analysis && !isLoading) {
    return (
      <Card className="border-muted/50 border bg-muted/10">
        <CardHeader>
          <CardTitle className="text-base">IRAC Reasoning</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Submit a query to see structured legal reasoning.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Scale className="h-4 w-4" />
              IRAC Reasoning
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Issue → Rule → Analysis → Conclusion</p>
          </div>
          {analysis && (
            <Badge variant="secondary" className="font-mono">
              {Math.round(analysis.confidence * 100)}% confidence
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4 mt-4">
            <ChainOfThought open>
              <ChainOfThoughtHeader>Reasoning Steps</ChainOfThoughtHeader>
              <ChainOfThoughtContent>
                <ChainOfThoughtStep
                  icon={FileText}
                  label="Issue Identification"
                  status="complete"
                  description="Extract the central legal question"
                >
                  {analysis ? (
                    <div className="rounded-md bg-muted/50 p-3 mt-2">
                      <p className="text-sm">{analysis.issue}</p>
                    </div>
                  ) : (
                    <div className="h-16 bg-muted/50 rounded animate-pulse" />
                  )}
                </ChainOfThoughtStep>

                <ChainOfThoughtStep
                  icon={BookOpen}
                  label="Applicable Law"
                  status="complete"
                  description="Identify relevant statutes and precedents"
                >
                  {analysis ? (
                    <div className="rounded-md bg-muted/50 p-3 mt-2 space-y-2">
                      <p className="text-sm">{analysis.law}</p>
                      <ChainOfThoughtSearchResults>
                        {analysis.sources.slice(0, 3).map((source, idx) => (
                          <ChainOfThoughtSearchResult key={idx}>
                            {source.citation}
                          </ChainOfThoughtSearchResult>
                        ))}
                      </ChainOfThoughtSearchResults>
                    </div>
                  ) : (
                    <div className="h-16 bg-muted/50 rounded animate-pulse" />
                  )}
                </ChainOfThoughtStep>

                <ChainOfThoughtStep
                  icon={CheckCircle}
                  label="Legal Analysis"
                  status="complete"
                  description="Apply law to facts"
                >
                  {analysis ? (
                    <div className="rounded-md bg-muted/50 p-3 mt-2">
                      <p className="text-sm">{analysis.analysis}</p>
                    </div>
                  ) : (
                    <div className="h-16 bg-muted/50 rounded animate-pulse" />
                  )}
                </ChainOfThoughtStep>

                <ChainOfThoughtStep
                  icon={Scale}
                  label="Conclusion"
                  status="complete"
                  description="Final legal opinion"
                >
                  {analysis ? (
                    <div className="rounded-md bg-cyan-500/10 border border-cyan-500/20 p-3 mt-2">
                      <p className="text-sm font-semibold text-cyan-900 dark:text-cyan-100">
                        {analysis.conclusion}
                      </p>
                    </div>
                  ) : (
                    <div className="h-16 bg-muted/50 rounded animate-pulse" />
                  )}
                </ChainOfThoughtStep>
              </ChainOfThoughtContent>
            </ChainOfThought>
          </TabsContent>

          <TabsContent value="sections" className="space-y-4 mt-4">
            {[
              { key: "issue", label: "Issue", icon: FileText },
              { key: "law", label: "Rule", icon: BookOpen },
              { key: "analysis", label: "Analysis", icon: CheckCircle },
              { key: "conclusion", label: "Conclusion", icon: Scale },
            ].map(({ key, label, icon: Icon }) => (
              <Card key={key} className="border-l-4 border-l-cyan-500/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-sm">{label}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {analysis ? (
                    <p className="text-sm leading-relaxed">
                      {String(analysis[key as keyof IRACAnalysis])}
                    </p>
                  ) : (
                    <div className="h-12 bg-muted/50 rounded animate-pulse" />
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {analysis && analysis.sources.length > 0 && (
          <div className="pt-4 border-t">
            <Sources>
              <SourcesTrigger count={analysis.sources.length} />
              <SourcesContent className="space-y-3">
                {analysis.sources.map((source, idx) => (
                  <Source key={idx} href={source.href || "#"} title={source.title}>
                    <BookOpen className="h-4 w-4" />
                    <div>
                      <p className="font-medium text-xs">{source.title}</p>
                      <p className="text-xs text-muted-foreground">{source.citation}</p>
                    </div>
                  </Source>
                ))}
              </SourcesContent>
            </Sources>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
