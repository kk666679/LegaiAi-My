"use client";
import * as React from "react";
import type { WorkflowMeta, WorkflowStats } from "../types";
import { AutomationCard } from "./automation-card";

export interface AutomationGridProps {
  workflows: WorkflowMeta[];
  statsById?: Record<string, WorkflowStats>;
  onOpen?: (w: WorkflowMeta) => void;
  onRun?: (w: WorkflowMeta) => void;
  onMenu?: (w: WorkflowMeta, anchor: HTMLElement) => void;
}

export function AutomationGrid({ workflows, statsById, onOpen, onRun, onMenu }: AutomationGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {workflows.map((w) => <AutomationCard key={w.id} workflow={w} stats={statsById?.[w.id]} onOpen={onOpen} onRun={onRun} onMenu={onMenu} />)}
    </div>
  );
}
