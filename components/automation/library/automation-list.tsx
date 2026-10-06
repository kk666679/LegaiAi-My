"use client";
import * as React from "react";
import type { WorkflowMeta } from "../types";
import { AutomationRow } from "./automation-row";

export interface AutomationListProps {
  workflows: WorkflowMeta[];
  onOpen?: (w: WorkflowMeta) => void;
  onRun?: (w: WorkflowMeta) => void;
  onMenu?: (w: WorkflowMeta, anchor: HTMLElement) => void;
}

export function AutomationList({ workflows, onOpen, onRun, onMenu }: AutomationListProps) {
  return (
    <div className="space-y-2">
      {workflows.map((w) => <AutomationRow key={w.id} workflow={w} onOpen={onOpen} onRun={onRun} onMenu={onMenu} />)}
    </div>
  );
}
