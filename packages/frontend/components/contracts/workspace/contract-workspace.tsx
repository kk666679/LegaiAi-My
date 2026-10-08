"use client";
import * as React from "react";
import { PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractStatusIndicator } from "../status/contract-status-indicator";
import type { Contract } from "../types";
import { cn } from "@/lib/utils";

export interface ContractWorkspaceTab { id: string; label: string; content: React.ReactNode; count?: number; badge?: React.ReactNode; }
export interface ContractWorkspaceProps {
  contract: Contract;
  tabs: ContractWorkspaceTab[];
  defaultTab?: string;
  contextPanel?: React.ReactNode;
  contextTitle?: string;
  headerActions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  onFavoriteChange?: (next: boolean) => void;
}

export function ContractWorkspace({ contract, tabs, defaultTab, contextPanel, contextTitle = "Contract context", headerActions, breadcrumbs, onFavoriteChange }: ContractWorkspaceProps) {
  const [active, setActive] = React.useState(defaultTab ?? tabs[0]?.id ?? "");
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        {breadcrumbs ? <div className="mb-1 text-xs text-muted-foreground">{breadcrumbs}</div> : null}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-semibold">{contract.name}</h1>
              <ContractStatusIndicator status={contract.status} compact />
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {contract.counterpartyName ? <span>{contract.counterpartyName}</span> : null}
              <span className="capitalize">{contract.type.replace("-", " ")}</span>
              {contract.value ? <span className="tabular-nums">{contract.currency ?? "RM"} {contract.value.toLocaleString()}</span> : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {headerActions}
            {contextPanel ? (
              <Sheet>
                <SheetTrigger asChild><Button variant="outline" size="icon" className="lg:hidden" aria-label="Context"><PanelRight className="size-4" /></Button></SheetTrigger>
                <SheetContent side="right" className="w-80 overflow-y-auto p-4"><p className="mb-3 text-sm font-medium">{contextTitle}</p>{contextPanel}</SheetContent>
              </Sheet>
            ) : null}
          </div>
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Tabs value={active} onValueChange={setActive} className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-border/60 px-4">
              <TabsList className="h-auto gap-1 bg-transparent p-0">
                {tabs.map((t) => (
                  <TabsTrigger key={t.id} value={t.id} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                    {t.label}
                    {typeof t.count === "number" ? <span className="ml-1.5 rounded bg-muted px-1.5 text-[10px] text-muted-foreground">{t.count}</span> : null}
                    {t.badge}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {tabs.map((t) => <TabsContent key={t.id} value={t.id} className="min-h-0 flex-1 overflow-y-auto p-4 data-[state=inactive]:hidden">{t.content}</TabsContent>)}
          </Tabs>
        </div>
        {contextPanel ? <aside aria-label={contextTitle} className="hidden w-[340px] shrink-0 border-l border-border/60 lg:block"><div className="h-full overflow-y-auto p-4">{contextPanel}</div></aside> : null}
      </div>
    </div>
  );
}
