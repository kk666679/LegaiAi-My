// components/documents/workspace/document-workspace.tsx
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";
import type { LegalDocument } from "../types";
import { DocumentStatusIndicator } from "../status/document-status-indicator";

export interface DocumentWorkspaceProps {
  document: LegalDocument;
  headerActions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  contextPanel?: React.ReactNode;
  contextTitle?: string;
  children: React.ReactNode;
}

export function DocumentWorkspace({
  document: doc,
  headerActions,
  breadcrumbs,
  contextPanel,
  contextTitle = "Context",
  children,
}: DocumentWorkspaceProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        {breadcrumbs ? (
          <div className="mb-1 text-xs text-muted-foreground">{breadcrumbs}</div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold">{doc.name}</h1>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <DocumentStatusIndicator status={doc.status} compact />
              <span>{doc.type}</span>
              {doc.updatedAt ? (
                <span>· Updated {new Date(doc.updatedAt).toLocaleDateString()}</span>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            {contextPanel ? (
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Open context panel"
                  >
                    <PanelRight className="size-4" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto p-4">
                  <p className="mb-3 text-sm font-medium">{contextTitle}</p>
                  {contextPanel}
                </SheetContent>
              </Sheet>
            ) : null}
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1">{children}</div>
        {contextPanel ? (
          <aside
            aria-label={contextTitle}
            className="hidden w-[360px] shrink-0 border-l border-border/60 lg:block"
          >
            <div className="h-full overflow-y-auto p-4">{contextPanel}</div>
          </aside>
        ) : null}
      </div>
    </div>
  );
}
