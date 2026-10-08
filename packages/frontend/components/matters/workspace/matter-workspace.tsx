// components/matters/workspace/matter-workspace.tsx
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PanelRight } from "lucide-react";
import type { Matter } from "../types";
import { MatterWorkspaceHeader } from "./matter-workspace-header";

export interface MatterWorkspaceTab {
  id: string;
  label: string;
  content: React.ReactNode;
  count?: number;
}

export interface MatterWorkspaceProps {
  matter: Matter;
  tabs: MatterWorkspaceTab[];
  defaultTab?: string;
  contextPanel?: React.ReactNode;
  contextTitle?: string;
  headerActions?: React.ReactNode;
  onFavoriteChange?: (next: boolean) => void;
}

export function MatterWorkspace({
  matter,
  tabs,
  defaultTab,
  contextPanel,
  contextTitle = "Matter context",
  headerActions,
  onFavoriteChange,
}: MatterWorkspaceProps) {
  const [activeTab, setActiveTab] = React.useState(defaultTab ?? tabs[0]?.id ?? "");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MatterWorkspaceHeader
        matter={matter}
        actions={headerActions}
        onFavoriteChange={onFavoriteChange}
      />

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="border-b border-border/60 px-4">
              <TabsList className="h-auto gap-1 bg-transparent p-0">
                {tabs.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    {t.label}
                    {typeof t.count === "number" ? (
                      <span className="ml-1.5 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">
                        {t.count}
                      </span>
                    ) : null}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {tabs.map((t) => (
              <TabsContent
                key={t.id}
                value={t.id}
                className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden"
              >
                {t.content}
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {contextPanel ? (
          <>
            <aside
              aria-label={contextTitle}
              className="hidden w-[340px] shrink-0 border-l border-border/60 lg:block"
            >
              <div className="h-full overflow-y-auto p-4">{contextPanel}</div>
            </aside>
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="fixed bottom-4 right-4 z-20 size-11 rounded-full shadow-lg lg:hidden"
                  aria-label={`Open ${contextTitle}`}
                >
                  <PanelRight className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 overflow-y-auto p-4">
                <p className="mb-3 text-sm font-medium">{contextTitle}</p>
                {contextPanel}
              </SheetContent>
            </Sheet>
          </>
        ) : null}
      </div>
    </div>
  );
}
