// components/automation/templates/default-templates.ts
import { MarkerType, type Edge } from "@xyflow/react";
import type { WorkflowTemplate } from "../types";
import { NODE_TYPE } from "../nodes";

const edge = (source: string, target: string, animated = false): Edge => ({
  id: `e-${source}-${target}`,
  source,
  target,
  type: "smoothstep",
  animated,
  markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217 91% 60%)" },
});

export const DEFAULT_TEMPLATES: WorkflowTemplate[] = [
  {
    id: "client-intake",
    name: "Client intake",
    description: "Route new matters from intake to ownership.",
    category: "Matters",
    tags: ["intake", "matter"],
    nodes: [
      { id: "intake", type: NODE_TYPE, position: { x: 60, y: 140 }, data: { kind: "trigger", title: "New client intake", description: "When a form is submitted", icon: "inbox", accent: "violet" } },
      { id: "classify", type: NODE_TYPE, position: { x: 340, y: 140 }, data: { kind: "action", title: "Classify matter", description: "Identify practice area", icon: "bot", accent: "blue" } },
      { id: "urgent", type: NODE_TYPE, position: { x: 620, y: 140 }, data: { kind: "condition", title: "Is this urgent?", description: "Route by urgency", icon: "branch", accent: "amber" } },
      { id: "notify", type: NODE_TYPE, position: { x: 900, y: 40 }, data: { kind: "action", title: "Notify attorney", description: "Send a priority alert", icon: "message", accent: "pink" } },
      { id: "follow", type: NODE_TYPE, position: { x: 900, y: 240 }, data: { kind: "action", title: "Create follow-up", description: "Schedule a task", icon: "clock", accent: "cyan" } },
      { id: "matter", type: NODE_TYPE, position: { x: 1180, y: 140 }, data: { kind: "output", title: "Create matter", description: "Save the intake", icon: "file", accent: "green" } },
    ],
    edges: [
      edge("intake", "classify"),
      edge("classify", "urgent", true),
      edge("urgent", "notify"),
      edge("urgent", "follow"),
      edge("notify", "matter"),
      edge("follow", "matter"),
    ],
  },
  {
    id: "document-review",
    name: "Document review",
    description: "Ingest, classify, and route documents for review.",
    category: "Documents",
    tags: ["document", "review"],
    nodes: [
      { id: "upload", type: NODE_TYPE, position: { x: 60, y: 140 }, data: { kind: "trigger", title: "Document uploaded", description: "When a file is attached", icon: "file", accent: "violet" } },
      { id: "classify", type: NODE_TYPE, position: { x: 340, y: 140 }, data: { kind: "action", title: "Classify document", description: "Detect type and jurisdiction", icon: "bot", accent: "blue" } },
      { id: "analyse", type: NODE_TYPE, position: { x: 620, y: 140 }, data: { kind: "action", title: "Analyse with AI", description: "Extract risks and dates", icon: "bot", accent: "blue" } },
      { id: "review", type: NODE_TYPE, position: { x: 900, y: 140 }, data: { kind: "human", title: "Request review", description: "Wait for lawyer approval", icon: "user", accent: "pink" } },
      { id: "file", type: NODE_TYPE, position: { x: 1180, y: 140 }, data: { kind: "output", title: "File to matter", description: "Attach to the matter", icon: "database", accent: "green" } },
    ],
    edges: [edge("upload", "classify"), edge("classify", "analyse"), edge("analyse", "review", true), edge("review", "file")],
  },
  {
    id: "deadline-monitor",
    name: "Deadline monitor",
    description: "Scan matters for approaching deadlines and alert the team.",
    category: "Matters",
    tags: ["deadline", "alert"],
    nodes: [
      { id: "schedule", type: NODE_TYPE, position: { x: 60, y: 140 }, data: { kind: "trigger", title: "Scheduled scan", description: "Every business day at 8 AM", icon: "clock", accent: "violet" } },
      { id: "query", type: NODE_TYPE, position: { x: 340, y: 140 }, data: { kind: "action", title: "Query deadlines", description: "Find due within 7 days", icon: "filter", accent: "blue" } },
      { id: "loop", type: NODE_TYPE, position: { x: 620, y: 140 }, data: { kind: "loop", title: "For each matter", description: "Iterate over matches", icon: "zap", accent: "cyan" } },
      { id: "notify", type: NODE_TYPE, position: { x: 900, y: 140 }, data: { kind: "action", title: "Notify owner", description: "Send reminder", icon: "message", accent: "pink" } },
    ],
    edges: [edge("schedule", "query"), edge("query", "loop"), edge("loop", "notify", true)],
  },
  {
    id: "billing-cycle",
    name: "Monthly billing",
    description: "Generate invoices from unbilled time at month-end.",
    category: "Billing",
    tags: ["billing", "invoice"],
    nodes: [
      { id: "end-month", type: NODE_TYPE, position: { x: 60, y: 140 }, data: { kind: "trigger", title: "Month end", description: "Last business day", icon: "clock", accent: "violet" } },
      { id: "collect", type: NODE_TYPE, position: { x: 340, y: 140 }, data: { kind: "action", title: "Collect unbilled", description: "Pull time entries", icon: "database", accent: "blue" } },
      { id: "generate", type: NODE_TYPE, position: { x: 620, y: 140 }, data: { kind: "action", title: "Generate invoices", description: "Create per-matter drafts", icon: "file", accent: "blue" } },
      { id: "approve", type: NODE_TYPE, position: { x: 900, y: 140 }, data: { kind: "human", title: "Approve batch", description: "Partner review", icon: "user", accent: "pink" } },
      { id: "send", type: NODE_TYPE, position: { x: 1180, y: 140 }, data: { kind: "action", title: "Send invoices", description: "Email to clients", icon: "message", accent: "green" } },
    ],
    edges: [edge("end-month", "collect"), edge("collect", "generate"), edge("generate", "approve", true), edge("approve", "send")],
  },
];
