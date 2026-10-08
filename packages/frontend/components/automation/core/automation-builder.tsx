// components/automation/core/automation-builder.tsx
"use client";

import * as React from "react";
import { toast } from "sonner";
import { AutomationHeader } from "./automation-header";
import { AutomationToolbar } from "./automation-toolbar";
import { AutomationShell } from "./automation-shell";
import { WorkflowCanvas } from "../canvas/workflow-canvas";
import { WorkflowPalette } from "../palette/workflow-palette";
import { TemplateLibrary } from "../templates/template-library";
import { NodeInspector } from "../inspector/node-inspector";
import { EventLog } from "../log/event-log";
import { AutomationAIPanel, type AutomationAIAction } from "../ai/automation-ai-panel";
import { DEFAULT_PALETTE } from "../palette/default-palette";
import { DEFAULT_TEMPLATES } from "../templates/default-templates";
import { NODE_TYPE } from "../nodes";
import { useAutomation } from "./automation-context";
import type { PaletteItem, WorkflowTemplate } from "../types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface AutomationBuilderProps {
  paletteItems?: PaletteItem[];
  templates?: WorkflowTemplate[];
  dark?: boolean;
  onToggleTheme?: () => void;
  onTestRun?: () => void | Promise<void>;
  onRunAIAction?: (action: AutomationAIAction) => void | Promise<void>;
}

export function AutomationBuilder({
  paletteItems = DEFAULT_PALETTE,
  templates = DEFAULT_TEMPLATES,
  dark = true,
  onToggleTheme,
  onTestRun,
  onRunAIAction,
}: AutomationBuilderProps) {
  const {
    meta,
    isDirty,
    nodes,
    edges,
    addNode,
    replaceWorkflow,
    record,
    markSaved,
  } = useAutomation();

  const [paletteOpen, setPaletteOpen] = React.useState(true);
  const [inspectorOpen, setInspectorOpen] = React.useState(true);
  const [logOpen, setLogOpen] = React.useState(false);
  const [aiOpen, setAiOpen] = React.useState(true);
  const [aiBusy, setAiBusy] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<string>();
  const [leftTab, setLeftTab] = React.useState<"library" | "templates">("library");
  const [running, setRunning] = React.useState(false);

  const handleAddFromPalette = React.useCallback(
    (item: PaletteItem) => {
      const id = `${item.kind}-${Date.now()}`;
      const node = {
        id,
        type: NODE_TYPE,
        position: { x: 120 + (nodes.length % 3) * 260, y: 120 + Math.floor(nodes.length / 3) * 140 },
        data: {
          kind: item.kind,
          title: item.title,
          description: item.description,
          icon: item.icon,
          accent: item.accent,
          status: "idle" as const,
        },
      };
      addNode(node);
    },
    [nodes.length, addNode],
  );

  const handleExport = React.useCallback(() => {
    const blob = new Blob([JSON.stringify({ meta, nodes, edges }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${meta.name.replace(/\s+/g, "-").toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    record("Exported workflow JSON", "success");
    toast.success("Exported workflow");
  }, [meta, nodes, edges, record]);

  const handleImport = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          replaceWorkflow(
            Array.isArray(parsed.nodes) ? parsed.nodes : [],
            Array.isArray(parsed.edges) ? parsed.edges : [],
            parsed.meta,
          );
          toast.success("Imported workflow");
        } catch {
          toast.error("Invalid workflow JSON");
          record("Import failed: invalid JSON", "error");
        }
      };
      reader.readAsText(file);
    },
    [replaceWorkflow, record],
  );

  const handleUseTemplate = React.useCallback(
    (t: WorkflowTemplate) => {
      replaceWorkflow(
        t.nodes.map((n) => ({ ...n })),
        t.edges.map((e) => ({ ...e })),
        { name: t.name, description: t.description },
      );
      toast.success(`Loaded template “${t.name}”`);
    },
    [replaceWorkflow],
  );

  const handleTest = React.useCallback(async () => {
    setRunning(true);
    record("Test run started", "action");
    try {
      if (onTestRun) await onTestRun();
    } finally {
      setTimeout(() => {
        setRunning(false);
        record("Test run finished", "success");
      }, 800);
    }
  }, [onTestRun, record]);

  const handleAIAction = React.useCallback(
    async (action: AutomationAIAction) => {
      setAiBusy(true);
      setAiResult(`Analysing: ${action.label}…`);
      try {
        if (onRunAIAction) {
          await onRunAIAction(action);
          setAiResult(`Applied ${action.label}.`);
        } else {
          setAiResult(`Suggestion: “${action.prompt}”`);
        }
        record(`AI action: ${action.label}`, "success");
      } catch {
        setAiResult("AI is temporarily unavailable.");
        record("AI action failed", "error");
      } finally {
        setAiBusy(false);
      }
    },
    [onRunAIAction, record],
  );

  const leftPanel = (
    <>
      <div className="border-b border-border/60 px-3 pt-3">
        <Tabs value={leftTab} onValueChange={(v) => setLeftTab(v as typeof leftTab)}>
          <TabsList className="w-full">
            <TabsTrigger value="library" className="flex-1">
              Library
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1">
              Templates
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {leftTab === "library" ? (
        <WorkflowPalette items={paletteItems} onAdd={handleAddFromPalette} />
      ) : (
        <TemplateLibrary templates={templates} onUse={handleUseTemplate} />
      )}
    </>
  );

  return (
    <AutomationShell
      header={
        <AutomationHeader
          workflowName={meta.name}
          isDirty={isDirty}
          actions={
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
              onClick={markSaved}
            >
              Save
            </button>
          }
        />
      }
      toolbar={
        <AutomationToolbar
          running={running}
          onTest={handleTest}
          onReset={() => {
            replaceWorkflow([], []);
            record("Reset workflow", "warning");
          }}
          onExport={handleExport}
          onImport={handleImport}
          onToggleAI={() => setAiOpen((v) => !v)}
          onToggleTheme={onToggleTheme}
          onTogglePalette={() => setPaletteOpen((v) => !v)}
          onToggleInspector={() => setInspectorOpen((v) => !v)}
          onToggleLog={() => setLogOpen((v) => !v)}
          aiOpen={aiOpen}
          dark={dark}
          paletteOpen={paletteOpen}
          inspectorOpen={inspectorOpen}
          logOpen={logOpen}
        />
      }
      palette={leftPanel}
      paletteOpen={paletteOpen}
      inspector={<NodeInspector onClose={() => setInspectorOpen(false)} />}
      inspectorOpen={inspectorOpen}
      canvas={
        <WorkflowCanvas dark={dark}>
          {logOpen ? (
            <div className="absolute bottom-2 left-2 z-10 w-[420px] max-w-[calc(100%-1rem)] rounded-md border border-border/60 bg-background/95 shadow-lg backdrop-blur">
              <EventLog maxHeight={140} />
            </div>
          ) : null}
        </WorkflowCanvas>
      }
      bottomPanel={
        aiOpen ? (
          <AutomationAIPanel
            busy={aiBusy}
            result={aiResult}
            onRun={handleAIAction}
            onClose={() => setAiOpen(false)}
          />
        ) : null
      }
    />
  );
}
