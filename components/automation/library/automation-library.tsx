"use client";
import * as React from "react";
import { LayoutGrid, List, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkflowMeta, WorkflowStats } from "../types";
import { AutomationGrid } from "./automation-grid";
import { AutomationList } from "./automation-list";
import { AutomationTable } from "./automation-table";
import { AutomationEmpty } from "../status/automation-empty";

export type ViewMode = "grid" | "list" | "table";

export interface AutomationLibraryProps {
  workflows: WorkflowMeta[];
  statsById?: Record<string, WorkflowStats>;
  view?: ViewMode;
  onViewChange?: (v: ViewMode) => void;
  onOpen?: (w: WorkflowMeta) => void;
  onRun?: (w: WorkflowMeta) => void;
  onMenu?: (w: WorkflowMeta, anchor: HTMLElement) => void;
  emptyAction?: { label: string; onClick: () => void };
}

export function AutomationLibrary({ workflows, statsById, view = "grid", onViewChange, onOpen, onRun, onMenu, emptyAction }: AutomationLibraryProps) {
  if (!workflows.length) return <AutomationEmpty primaryAction={emptyAction} />;
  return (
    <div className="space-y-3">
      {onViewChange ? (
        <div className="flex justify-end">
          <Tabs value={view} onValueChange={(v) => onViewChange(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="grid" aria-label="Grid"><LayoutGrid className="size-4" /></TabsTrigger>
              <TabsTrigger value="list" aria-label="List"><List className="size-4" /></TabsTrigger>
              <TabsTrigger value="table" aria-label="Table"><Table2 className="size-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}
      {view === "grid" ? <AutomationGrid workflows={workflows} statsById={statsById} onOpen={onOpen} onRun={onRun} onMenu={onMenu} /> :
       view === "list" ? <AutomationList workflows={workflows} onOpen={onOpen} onRun={onRun} onMenu={onMenu} /> :
       <AutomationTable workflows={workflows} statsById={statsById} onOpen={onOpen} />}
    </div>
  );
}
