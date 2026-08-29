"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Artifact,
  ArtifactHeader,
  ArtifactTitle,
  ArtifactDescription,
  ArtifactContent,
  ArtifactActions,
  ArtifactAction,
} from "@/components/ai-elements/artifact";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Download,
  Copy,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export interface DocumentArtifact {
  id: string;
  title: string;
  type: "draft" | "opinion" | "audit" | "finding";
  status: "pending" | "complete" | "error";
  content: string;
  createdAt: Date;
  confidence?: number;
  format?: "markdown" | "html" | "pdf";
}

interface DocumentArtifactsResultsProps {
  artifacts?: DocumentArtifact[];
  isLoading?: boolean;
}

function getStatusConfig(status: DocumentArtifact["status"]) {
  const configs = {
    pending: { icon: Clock, variant: "secondary" as const, label: "Processing" },
    complete: { icon: CheckCircle, variant: "default" as const, label: "Complete" },
    error: { icon: AlertCircle, variant: "destructive" as const, label: "Error" },
  };
  return configs[status];
}

function getTypeLabel(type: DocumentArtifact["type"]) {
  const labels = {
    draft: "📄 Draft",
    opinion: "⚖️ Legal Opinion",
    audit: "✓ Audit Report",
    finding: "🔍 Finding",
  };
  return labels[type];
}

export function DocumentArtifactsResults({ artifacts = [], isLoading = false }: DocumentArtifactsResultsProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!isLoading && artifacts.length === 0) {
    return (
      <Card className="border-muted/50 border bg-muted/10">
        <CardHeader>
          <CardTitle className="text-base">Results & Artifacts</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Generated documents and findings will appear here.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Results & Artifacts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-[32rem] pr-4">
          <div className="space-y-4">
            {isLoading && artifacts.length === 0 ? (
              // Loading skeleton
              Array.from({ length: 3 }).map((_, idx) => (
                <Card key={idx} className="overflow-hidden">
                  <div className="h-24 bg-muted/50 rounded animate-pulse" />
                </Card>
              ))
            ) : (
              artifacts.map((artifact) => {
                const statusConfig = getStatusConfig(artifact.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Artifact key={artifact.id} className="rounded-lg border">
                    <ArtifactHeader>
                      <div className="flex items-center justify-between gap-4 w-full">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="flex-shrink-0 w-8 h-8 rounded bg-muted/50 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <ArtifactTitle className="truncate">
                              {artifact.title}
                            </ArtifactTitle>
                            <ArtifactDescription className="text-xs mt-0.5">
                              {getTypeLabel(artifact.type)} •{" "}
                              {artifact.createdAt.toLocaleTimeString()}
                            </ArtifactDescription>
                          </div>
                        </div>
                        <Badge
                          variant={statusConfig.variant}
                          className="flex-shrink-0 gap-1"
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusConfig.label}
                        </Badge>
                      </div>
                    </ArtifactHeader>

                    <ArtifactContent>
                      <div className="max-h-64 overflow-hidden">
                        <div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                          {artifact.content}
                        </div>
                        {artifact.content.length > 500 && (
                          <div className="mt-3 p-3 bg-gradient-to-t from-background to-transparent text-center">
                            <Button
                              variant="link"
                              size="sm"
                              className="text-xs"
                            >
                              View Full Document
                            </Button>
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-4 border-t flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {artifact.format && (
                            <Badge variant="outline" className="text-xs">
                              {artifact.format.toUpperCase()}
                            </Badge>
                          )}
                          {artifact.confidence !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {Math.round(artifact.confidence * 100)}%
                            </Badge>
                          )}
                        </div>

                        <ArtifactActions>
                          <ArtifactAction
                            tooltip="Copy to clipboard"
                            icon={Copy}
                            onClick={() =>
                              handleCopy(artifact.id, artifact.content)
                            }
                          />
                          <ArtifactAction
                            tooltip="Download"
                            icon={Download}
                          />
                          <ArtifactAction
                            tooltip="Open in new tab"
                            icon={ExternalLink}
                          />
                        </ArtifactActions>
                      </div>
                    </ArtifactContent>
                  </Artifact>
                );
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
