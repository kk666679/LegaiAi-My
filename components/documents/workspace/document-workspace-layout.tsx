"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { DocumentWorkspaceHeader } from "./document-workspace-header";
import { DocumentWorkspaceTabs, type WorkspaceTab } from "./document-workspace-tabs";
import { DocumentContextPanel } from "./document-context-panel";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";
import type { LegalDocument } from "../types";

export interface DocumentWorkspaceLayoutProps {
  document: LegalDocument;
  tabs: WorkspaceTab[];
  contextSections?: Array<{ title: string; content: React.ReactNode }>;
  headerActions?: React.ReactNode;
  collaborators?: Array<{ id: string; name: string; avatarUrl?: string }>;
  onFavoriteChange?: (next: boolean) => void;
  className?: string;
}

export function DocumentWorkspaceLayout({ document, tabs, contextSections, headerActions, collaborators, onFavoriteChange, className }: DocumentWorkspaceLayoutProps) {
  const panel = <DocumentContextPanel document={document} sections={contextSections} />;
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      <DocumentWorkspaceHeader document={document} collaborators={collaborators} actions={headerActions} onFavoriteChange={onFavoriteChange} />
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1">
          <DocumentWorkspaceTabs tabs={tabs} />
        </div>
        <aside aria-label="Document context" className="hidden w-[340px] shrink-0 border-l border-border/60 lg:block">
          <div className="h-full overflow-y-auto p-3">{panel}</div>
        </aside>
      </div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="fixed bottom-4 right-4 z-20 size-11 rounded-full shadow-lg lg:hidden" aria-label="Open context">
            <PanelRight className="size-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-80 overflow-y-auto p-3">{panel}</SheetContent>
      </Sheet>
    </div>
  );
}
