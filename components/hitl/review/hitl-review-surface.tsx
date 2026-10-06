// components/hitl/review/hitl-review-surface.tsx
"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HITLRequest } from "../types";
import { HITLReviewHeader } from "./hitl-review-header";
import { HITLCommentThread } from "./hitl-comment-thread";
import { HITLArtifactList } from "../item/hitl-artifact-list";
import { HITLThresholdList } from "../item/hitl-threshold-list";

export interface HITLReviewSurfaceProps {
  request: HITLRequest;
  headerActions?: React.ReactNode;
  sidePanel?: React.ReactNode;
  children?: React.ReactNode;
  onAddComment?: (body: string, internal?: boolean) => void;
  onArtifactSelect?: (id: string) => void;
}

export function HITLReviewSurface({
  request,
  headerActions,
  sidePanel,
  children,
  onAddComment,
  onArtifactSelect,
}: HITLReviewSurfaceProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HITLReviewHeader request={request} actions={headerActions} />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Tabs defaultValue="content" className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border/60 px-4">
              <TabsList className="h-auto gap-1 bg-transparent p-0">
                <TabsTrigger
                  value="content"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Content
                </TabsTrigger>
                {request.artifacts?.length ? (
                  <TabsTrigger
                    value="artifacts"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Artifacts ({request.artifacts.length})
                  </TabsTrigger>
                ) : null}
                {request.thresholds?.length ? (
                  <TabsTrigger
                    value="thresholds"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    Thresholds
                  </TabsTrigger>
                ) : null}
                <TabsTrigger
                  value="comments"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                >
                  Comments ({request.comments?.length ?? 0})
                </TabsTrigger>
              </TabsList>
            </div>
            <TabsContent
              value="content"
              className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
            >
              {children ?? (
                <p className="text-sm text-muted-foreground">No content preview available.</p>
              )}
            </TabsContent>
            {request.artifacts?.length ? (
              <TabsContent
                value="artifacts"
                className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
              >
                <HITLArtifactList
                  artifacts={request.artifacts}
                  onSelect={(a) => onArtifactSelect?.(a.id)}
                />
              </TabsContent>
            ) : null}
            {request.thresholds?.length ? (
              <TabsContent
                value="thresholds"
                className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
              >
                <Card className="p-3">
                  <HITLThresholdList thresholds={request.thresholds} />
                </Card>
              </TabsContent>
            ) : null}
            <TabsContent
              value="comments"
              className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
            >
              <HITLCommentThread comments={request.comments ?? []} onAdd={onAddComment} />
            </TabsContent>
          </Tabs>
        </div>
        {sidePanel ? (
          <aside
            aria-label="Review side panel"
            className="hidden w-[360px] shrink-0 border-l border-border/60 lg:block"
          >
            <div className="h-full overflow-y-auto p-4">{sidePanel}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}