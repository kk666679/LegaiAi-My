// components/documents/ai/document-ai-workspace.tsx
"use client";

import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentAIActions } from "./document-ai-actions";
import { Separator } from "@/components/ui/separator";

export interface DocumentAIWorkspaceProps {
  assistantSlot?: React.ReactNode;
  insightsSlot?: React.ReactNode;
  evidenceSlot?: React.ReactNode;
  onAction?: (id: string) => void;
}

export function DocumentAIWorkspace({
  assistantSlot,
  insightsSlot,
  evidenceSlot,
  onAction,
}: DocumentAIWorkspaceProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border/60 p-3">
        <DocumentAIActions onAction={onAction} />
      </div>
      <Tabs defaultValue="assistant" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border/60 px-3 py-2">
          <TabsList>
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="assistant" className="min-h-0 flex-1 overflow-y-auto p-3">
          {assistantSlot}
        </TabsContent>
        <TabsContent value="insights" className="min-h-0 flex-1 overflow-y-auto p-3">
          {insightsSlot}
        </TabsContent>
        <TabsContent value="evidence" className="min-h-0 flex-1 overflow-y-auto p-3">
          {evidenceSlot}
        </TabsContent>
      </Tabs>
      <Separator />
    </div>
  );
}
