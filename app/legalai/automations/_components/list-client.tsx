"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AutomationLibrary,
  AutomationStatsBar,
  WorkflowSearch,
  useAutomationList,
  type ViewMode,
} from "@/components/automation";

export function AutomationsListPage() {
  const [view, setView] = React.useState<ViewMode>("grid");
  const [query, setQuery] = React.useState("");
  const { workflows, statsById, loading, error } = useAutomationList({ query });

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Automations</h1>
          <p className="text-xs text-muted-foreground">Design, test, and run legal workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5"><Upload className="size-3.5" />Import</Button>
          <Button asChild size="sm" className="gap-1.5">
            <Link href="/legalai/automations/new"><Plus className="size-3.5" />New workflow</Link>
          </Button>
        </div>
      </header>
      <div className="space-y-4 p-4">
        <AutomationStatsBar stats={{ total: workflows.length, active: workflows.filter((w) => w.status === "active").length, draft: workflows.filter((w) => w.status === "draft").length, runs24h: 0, successRate: 0 }} />
        <WorkflowSearch value={query} onChange={setQuery} />
        {error ? (
          <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">{error}</div>
        ) : (
          <AutomationLibrary
            workflows={workflows}
            statsById={statsById}
            view={view}
            onViewChange={setView}
            emptyAction={{ label: "Create workflow", onClick: () => { window.location.href = "/legalai/automations/new"; } }}
          />
        )}
      </div>
    </div>
  );
}
