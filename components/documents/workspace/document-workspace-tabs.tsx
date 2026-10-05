"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface WorkspaceTab { id: string; label: string; content: React.ReactNode; count?: number; }
export interface DocumentWorkspaceTabsProps { tabs: WorkspaceTab[]; defaultTab?: string; className?: string; }

export function DocumentWorkspaceTabs({ tabs, defaultTab, className }: DocumentWorkspaceTabsProps) {
  const [active, setActive] = React.useState(defaultTab ?? tabs[0]?.id ?? "");
  return (
    <Tabs value={active} onValueChange={setActive} className={className}>
      <div className="border-b border-border/60 px-4">
        <TabsList className="h-auto gap-1 bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              {t.label}
              {typeof t.count === "number" ? <span className="ml-1.5 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{t.count}</span> : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {tabs.map((t) => <TabsContent key={t.id} value={t.id} className="mt-0">{t.content}</TabsContent>)}
    </Tabs>
  );
}
