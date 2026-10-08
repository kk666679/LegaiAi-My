"use client";
import * as React from "react";
import {
  AutomationBuilder,
  AutomationProvider,
  DEFAULT_TEMPLATES,
  type WorkflowMeta,
  type WorkflowNode,
  type Edge,
} from "@/components/automation";

export function BuilderPage({ id, templateId }: { id: string; templateId?: string }) {
  const [dark, setDark] = React.useState(true);

  // Replace with real fetch: GET /api/automations/:id
  const template = DEFAULT_TEMPLATES.find((t) => t.id === templateId) ?? DEFAULT_TEMPLATES[0];
  if (!template) return null;

  const meta: WorkflowMeta = {
    id,
    name: template.name,
    description: template.description,
    category: template.category,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialNodes = (template.nodes ?? []) as WorkflowNode[];
  const initialEdges = (template.edges ?? []) as Edge[];

  return (
    <div className="h-full">
      <AutomationProvider meta={meta} initialNodes={initialNodes} initialEdges={initialEdges}>
        <AutomationBuilder
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          onTestRun={async () => { /* POST /api/automations/:id/runs */ }}
          onRunAIAction={async (a) => { /* POST /api/ai { intent: a.prompt } */ }}
        />
      </AutomationProvider>
    </div>
  );
}
