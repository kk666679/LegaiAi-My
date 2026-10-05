// components/automation/nodes/index.ts
"use client";

import type { NodeTypes } from "@xyflow/react";
import { WorkflowNodeComponent } from "./workflow-node";

export const NODE_TYPE = "workflowNode";

export const nodeTypes: NodeTypes = {
  [NODE_TYPE]: WorkflowNodeComponent,
};

export { WorkflowNodeComponent } from "./workflow-node";
export * from "./node-icons";
