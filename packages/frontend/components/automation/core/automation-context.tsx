// components/automation/core/automation-context.tsx
"use client";

import * as React from "react";
import {
  addEdge,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
  MarkerType,
} from "@xyflow/react";
import type {
  WorkflowCapabilities,
  WorkflowEvent,
  WorkflowMeta,
  WorkflowNode,
  WorkflowNodeStatus,
} from "../types";

interface AutomationContextValue {
  meta: WorkflowMeta;
  nodes: WorkflowNode[];
  edges: Edge[];
  selectedId: string | null;
  selectedNode: WorkflowNode | null;
  events: WorkflowEvent[];
  capabilities: WorkflowCapabilities;
  isDirty: boolean;

  setSelectedId: (id: string | null) => void;
  updateSelected: (patch: Partial<WorkflowNode["data"]>) => void;
  updateMeta: (patch: Partial<WorkflowMeta>) => void;
  updateNodeStatus: (id: string, status: WorkflowNodeStatus, message?: string) => void;
  addNode: (node: WorkflowNode) => void;
  removeNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  replaceWorkflow: (nodes: WorkflowNode[], edges: Edge[], meta?: Partial<WorkflowMeta>) => void;
  onNodesChange: ReturnType<typeof useNodesState<WorkflowNode>>[2];
  onEdgesChange: ReturnType<typeof useEdgesState<Edge>>[2];
  onConnect: (connection: Connection) => void;
  record: (message: string, kind?: WorkflowEvent["kind"], nodeId?: string) => void;
  clearEvents: () => void;
  markSaved: () => void;
}

const AutomationContext = React.createContext<AutomationContextValue | null>(null);

const DEFAULT_CAPS: WorkflowCapabilities = {
  canEdit: true,
  canRun: true,
  canDelete: true,
  canShare: true,
  canPublish: true,
};

let eventSeq = 0;
function makeId() {
  eventSeq += 1;
  return `evt-${Date.now()}-${eventSeq}`;
}

export interface AutomationProviderProps {
  children: React.ReactNode;
  meta: WorkflowMeta;
  initialNodes: WorkflowNode[];
  initialEdges: Edge[];
  capabilities?: Partial<WorkflowCapabilities>;
}

export function AutomationProvider({
  children,
  meta: initialMeta,
  initialNodes,
  initialEdges,
  capabilities,
}: AutomationProviderProps) {
  const [meta, setMeta] = React.useState<WorkflowMeta>(initialMeta);
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialEdges);
  const [selectedId, setSelectedId] = React.useState<string | null>(initialNodes[0]?.id ?? null);
  const [events, setEvents] = React.useState<WorkflowEvent[]>([
    { id: makeId(), timestamp: new Date().toISOString(), kind: "info", message: "Workflow loaded" },
  ]);
  const [isDirty, setIsDirty] = React.useState(false);

  // Reset when meta prop changes (e.g. navigating to a different workflow)
  React.useEffect(() => setMeta(initialMeta), [initialMeta]);
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setSelectedId(initialNodes[0]?.id ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes, initialEdges]);

  const selectedNode = React.useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );

  const record = React.useCallback(
    (message: string, kind: WorkflowEvent["kind"] = "info", nodeId?: string) => {
      setEvents((prev) =>
        [
          { id: makeId(), timestamp: new Date().toISOString(), kind, message, nodeId },
          ...prev,
        ].slice(0, 200),
      );
    },
    [],
  );

  const onConnect = React.useCallback(
    (connection: Connection) => {
      setEdges((current) =>
        addEdge(
          {
            ...connection,
            type: "smoothstep",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed, color: "hsl(217 91% 60%)" },
          },
          current,
        ),
      );
      setIsDirty(true);
      record("Connected workflow steps", "action");
    },
    [setEdges, record],
  );

  const updateSelected = React.useCallback(
    (patch: Partial<WorkflowNode["data"]>) => {
      if (!selectedId) return;
      setNodes((current) =>
        current.map((n) => (n.id === selectedId ? { ...n, data: { ...n.data, ...patch } } : n)),
      );
      setIsDirty(true);
    },
    [selectedId, setNodes],
  );

  const updateMeta = React.useCallback((patch: Partial<WorkflowMeta>) => {
    setMeta((prev) => ({ ...prev, ...patch, updatedAt: new Date().toISOString() }));
    setIsDirty(true);
  }, []);

  const updateNodeStatus = React.useCallback(
    (id: string, status: WorkflowNodeStatus, message?: string) => {
      setNodes((current) =>
        current.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, status, errorMessage: status === "failed" ? message : undefined } }
            : n,
        ),
      );
    },
    [setNodes],
  );

  const addNode = React.useCallback(
    (node: WorkflowNode) => {
      setNodes((current) => [...current, node]);
      setSelectedId(node.id);
      setIsDirty(true);
      record(`Added “${node.data.title}”`, "action", node.id);
    },
    [setNodes, record],
  );

  const removeNode = React.useCallback(
    (id: string) => {
      setNodes((current) => current.filter((n) => n.id !== id));
      setEdges((current) => current.filter((e) => e.source !== id && e.target !== id));
      setSelectedId((prev) => (prev === id ? null : prev));
      setIsDirty(true);
      record("Removed step", "warning");
    },
    [setNodes, setEdges, record],
  );

  const duplicateNode = React.useCallback(
    (id: string) => {
      const original = nodes.find((n) => n.id === id);
      if (!original) return;
      const copy: WorkflowNode = {
        ...original,
        id: `${original.id}-copy-${Date.now()}`,
        position: { x: original.position.x + 40, y: original.position.y + 40 },
        data: { ...original.data, title: `${original.data.title} (copy)`, status: "idle" },
      };
      setNodes((current) => [...current, copy]);
      setSelectedId(copy.id);
      setIsDirty(true);
      record(`Duplicated “${original.data.title}”`, "action", copy.id);
    },
    [nodes, setNodes, record],
  );

  const replaceWorkflow = React.useCallback(
    (newNodes: WorkflowNode[], newEdges: Edge[], metaPatch?: Partial<WorkflowMeta>) => {
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedId(newNodes[0]?.id ?? null);
      if (metaPatch) setMeta((prev) => ({ ...prev, ...metaPatch }));
      setIsDirty(true);
      record("Replaced workflow", "action");
    },
    [setNodes, setEdges, record],
  );

  const clearEvents = React.useCallback(() => setEvents([]), []);
  const markSaved = React.useCallback(() => {
    setIsDirty(false);
    record("Saved", "success");
  }, [record]);

  const value = React.useMemo<AutomationContextValue>(
    () => ({
      meta,
      nodes,
      edges,
      selectedId,
      selectedNode,
      events,
      capabilities: { ...DEFAULT_CAPS, ...capabilities },
      isDirty,
      setSelectedId,
      updateSelected,
      updateMeta,
      updateNodeStatus,
      addNode,
      removeNode,
      duplicateNode,
      replaceWorkflow,
      onNodesChange,
      onEdgesChange,
      onConnect,
      record,
      clearEvents,
      markSaved,
    }),
    [
      meta,
      nodes,
      edges,
      selectedId,
      selectedNode,
      events,
      capabilities,
      isDirty,
      updateSelected,
      updateMeta,
      updateNodeStatus,
      addNode,
      removeNode,
      duplicateNode,
      replaceWorkflow,
      onNodesChange,
      onEdgesChange,
      onConnect,
      record,
      clearEvents,
      markSaved,
    ],
  );

  return <AutomationContext.Provider value={value}>{children}</AutomationContext.Provider>;
}

export function useAutomation(): AutomationContextValue {
  const ctx = React.useContext(AutomationContext);
  if (!ctx) throw new Error("useAutomation must be used inside <AutomationProvider>.");
  return ctx;
}
