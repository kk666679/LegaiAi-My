// app/lawmate/automations/[id]/builder/builder-client.tsx
"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  AutomationBuilder,
  AutomationProvider,
  type WorkflowMeta,
  type WorkflowNode,
  type Edge,
} from "@/components/automation";
import { trpcReact } from "@/clients";
import { AutomationEmpty } from "@/components/automation/status/automation-empty";
import { AutomationLoading } from "@/components/automation/status/automation-loading";
import { AutomationError } from "@/components/automation/status/automation-error";

export function BuilderPage({ id, templateId: initialTemplateId }: { id: string; templateId?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dark, setDark] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [templateId, setTemplateId] = React.useState<string | null>(initialTemplateId ?? null);

  // Load automation data
  React.useEffect(() => {
    const loadAutomation = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const automation = await trpcReact.automations.get.query({ id });
        // Store in refs for use in render
        if (!initialMetaRef.current) {
          initialMetaRef.current = {
            id: automation.id,
            name: automation.name,
            description: automation.description ?? undefined,
            category: automation.category ?? undefined,
            status: automation.status,
            ownerId: undefined,
            ownerName: undefined,
            matterId: undefined,
            tags: automation.tags,
            createdAt: automation.createdAt,
            updatedAt: automation.updatedAt,
          };
          initialNodesRef.current = automation.definition.nodes as WorkflowNode[];
          initialEdgesRef.current = automation.definition.edges as Edge[];
        }
      } catch (err) {
        setError(`Failed to load workflow: ${(err as Error)?.message ?? "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadAutomation();
    }
  }, [id]);

  // Refs to store initial data (to avoid issues with useEffect dependencies)
  const initialMetaRef = React.useRef<WorkflowMeta | null>(null);
  const initialNodesRef = React.useRef<WorkflowNode[]>([]);
  const initialEdgesRef = React.useRef<Edge[]>([]);

  // Handle template override from URL
  React.useEffect(() => {
    const templateFromUrl = searchParams.get("template");
    if (templateFromUrl) {
      setTemplateId(templateFromUrl);
    }
  }, [searchParams, setTemplateId]);

  // Save handler
  const handleSave = async (meta: WorkflowMeta, nodes: WorkflowNode[], edges: Edge[]) => {
    try {
      await trpcReact.automations.update.mutate({
        id,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        tags: meta.tags,
        definition: { nodes, edges },
        versionSummary: "Saved from builder",
      });
      toast.success("Workflow saved");
    } catch (err) {
      toast.error(`Failed to save workflow: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  // Test run handler
  const handleTestRun = async () => {
    try {
      await trpcReact.automations.runs.trigger.mutate({
        automationId: id,
        trigger: "manual",
      });
      toast.success("Test run started");
    } catch (err) {
      toast.error(`Failed to start test run: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  // AI action handler
  const handleRunAIAction = async (action: { prompt: string; label: string; description?: string; icon?: React.ReactNode }) => {
    // This would connect to AI automation panel - for now just show a toast
    toast.info(`AI action: ${action.label}`);
  };

  if (isLoading) {
    return <AutomationLoading />;
  }

  if (error) {
    return <AutomationError title="Couldn't load workflow" description={error} onRetry={() => window.location.reload()} />;
  }

  // Use initial values from refs (set after first load)
  const meta = initialMetaRef.current;
  const nodes = initialNodesRef.current;
  const edges = initialEdgesRef.current;

  if (!meta) {
    return <AutomationEmpty primaryAction={{ label: "Create workflow", onClick: () => { router.push("/lawmate/automations/new"); } }} />;
  }

  return (
    <div className="h-full">
      <AutomationProvider 
        meta={meta} 
        initialNodes={nodes} 
        initialEdges={edges}
      >
        <AutomationBuilder
          dark={dark}
          onToggleTheme={() => setDark((d) => !d)}
          onTestRun={handleTestRun}
          onRunAIAction={handleRunAIAction}
        />
      </AutomationProvider>
    </div>
  );
}