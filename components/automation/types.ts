// components/automation/types.ts
import type { Edge, Node } from "@xyflow/react";
import type { ReactNode } from "react";

export type NodeKind = "trigger" | "action" | "condition" | "output" | "delay" | "loop" | "human";

export type NodeAccent =
  | "violet"
  | "blue"
  | "amber"
  | "green"
  | "cyan"
  | "pink"
  | "red"
  | "slate";

export type NodeIconKey =
  | "inbox"
  | "bot"
  | "branch"
  | "message"
  | "clock"
  | "file"
  | "filter"
  | "user"
  | "shield"
  | "zap"
  | "webhook"
  | "database";

export interface NodeConfigField {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "boolean" | "select" | "json" | "date" | "user" | "matter" | "document";
  value?: unknown;
  options?: Array<{ label: string; value: string }>;
  placeholder?: string;
  required?: boolean;
  help?: string;
}

export interface NodeData extends Record<string, unknown> {
  kind: NodeKind;
  title: string;
  description?: string;
  icon?: NodeIconKey;
  accent?: NodeAccent;
  config?: string;
  fields?: NodeConfigField[];
  status?: WorkflowNodeStatus;
  errorMessage?: string;
}

export type WorkflowNode = Node<NodeData>;

export type WorkflowNodeStatus =
  | "idle"
  | "queued"
  | "running"
  | "success"
  | "failed"
  | "skipped"
  | "waiting";

export interface PaletteItem {
  kind: NodeKind;
  title: string;
  description: string;
  accent: NodeAccent;
  icon?: NodeIconKey;
  category: string;
  keywords?: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  nodes: WorkflowNode[];
  edges: Edge[];
  tags?: string[];
}

export interface WorkflowEvent {
  id: string;
  timestamp: string;
  kind: "info" | "action" | "success" | "warning" | "error";
  message: string;
  nodeId?: string;
  userId?: string;
}

export interface WorkflowRun {
  id: string;
  workflowId: string;
  startedAt: string;
  finishedAt?: string;
  status: "queued" | "running" | "success" | "failed" | "cancelled";
  trigger?: string;
  durationMs?: number;
  nodeResults?: Array<{ nodeId: string; status: WorkflowNodeStatus; message?: string }>;
}

export interface WorkflowVersion {
  id: string;
  workflowId: string;
  versionNumber: number;
  createdAt: string;
  authorName?: string;
  summary?: string;
  isCurrent?: boolean;
}

export interface WorkflowMeta {
  id: string;
  name: string;
  description?: string;
  category?: string;
  status: "draft" | "active" | "paused" | "archived";
  ownerId?: string;
  ownerName?: string;
  matterId?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStats {
  totalRuns: number;
  successRate: number;
  avgDurationMs: number;
  lastRunAt?: string;
  activeRuns: number;
}

export interface WorkflowCapabilities {
  canEdit: boolean;
  canRun: boolean;
  canDelete: boolean;
  canShare: boolean;
  canPublish: boolean;
}

export interface AutomationAIIntent {
  id: string;
  label: string;
  icon?: ReactNode;
  prompt: string;
  description?: string;
}

export type { Node, Edge, ReactNode };
