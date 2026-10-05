// components/automation/canvas/workflow-canvas.tsx
"use client";

import * as React from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { cn } from "@/lib/utils";
import { useAutomation } from "../core/automation-context";
import { nodeTypes } from "../nodes";
import type { NodeAccent } from "../types";

const MINIMAP_COLORS: Record<NodeAccent, string> = {
  violet: "#8b5cf6",
  blue: "#3b82f6",
  amber: "#f59e0b",
  green: "#10b981",
  cyan: "#06b6d4",
  pink: "#ec4899",
  red: "#ef4444",
  slate: "#64748b",
};

export interface WorkflowCanvasProps {
  dark?: boolean;
  showMiniMap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  className?: string;
  children?: React.ReactNode;
}

function CanvasInner({
  dark = true,
  showMiniMap = true,
  showControls = true,
  showBackground = true,
  className,
  children,
}: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    selectedId,
    setSelectedId,
    onNodesChange,
    onEdgesChange,
    onConnect,
    record,
  } = useAutomation();

  return (
    <div className={cn("relative size-full", className)}>
      <ReactFlow
        nodes={nodes.map((n) => ({ ...n, selected: n.id === selectedId }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => {
          setSelectedId(node.id);
          record(`Selected “${node.data.title}”`, "info", node.id);
        }}
        onPaneClick={() => setSelectedId(null)}
        nodeTypes={nodeTypes as NodeTypes}
        defaultViewport={{ x: 30, y: 30, zoom: 0.65 }}
        proOptions={{ hideAttribution: true }}
        colorMode={dark ? "dark" : "light"}
        fitView
        minZoom={0.2}
        maxZoom={2}
      >
        {showBackground ? (
          <Background
            variant={BackgroundVariant.Dots}
            color={dark ? "#263149" : "#d8dee9"}
            gap={22}
            size={1}
          />
        ) : null}
        {showMiniMap ? (
          <MiniMap
            nodeColor={(node) => {
              const accent = (node.data as { accent?: NodeAccent }).accent ?? "slate";
              return MINIMAP_COLORS[accent] ?? MINIMAP_COLORS.slate;
            }}
            pannable
            zoomable
          />
        ) : null}
        {showControls ? <Controls showInteractive /> : null}
      </ReactFlow>
      {children}
    </div>
  );
}

export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}

/** Fit all nodes into view. */
export function useFitView() {
  const { fitView } = useReactFlow();
  return React.useCallback(() => fitView({ padding: 0.2, duration: 300 }), [fitView]);
}
