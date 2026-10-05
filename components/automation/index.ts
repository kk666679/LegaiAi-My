// components/automation/index.ts
export * from "./types";

// core
export { AutomationProvider, useAutomation } from "./core/automation-context";
export { AutomationShell } from "./core/automation-shell";
export { AutomationHeader } from "./core/automation-header";
export { AutomationToolbar } from "./core/automation-toolbar";
export { AutomationBuilder } from "./core/automation-builder";

// canvas
export { WorkflowCanvas, useFitView } from "./canvas/workflow-canvas";

// nodes
export { NODE_TYPE, nodeTypes, WorkflowNodeComponent } from "./nodes";
export { NODE_ICONS, FALLBACK_ICON, ACCENT_BG, ACCENT_BORDER } from "./nodes/node-icons";

// palette
export { WorkflowPalette } from "./palette/workflow-palette";
export { PaletteItemRow } from "./palette/palette-item";
export { DEFAULT_PALETTE, PALETTE_CATEGORIES } from "./palette/default-palette";

// templates
export { TemplateLibrary } from "./templates/template-library";
export { TemplateCard } from "./templates/template-card";
export { DEFAULT_TEMPLATES } from "./templates/default-templates";

// inspector
export { NodeInspector } from "./inspector/node-inspector";
export { FieldEditor } from "./inspector/field-editor";

// log
export { EventLog } from "./log/event-log";

// AI
export { AutomationAIPanel } from "./ai/automation-ai-panel";

// runs
export { RunList } from "./runs/run-list";
export { RunStatusBadge } from "./runs/run-status";

// versions
export { VersionList } from "./versions/version-list";

// search
export { WorkflowSearch } from "./search/workflow-search";

// status
export { AutomationEmpty } from "./status/automation-empty";
export { AutomationLoading } from "./status/automation-loading";
export { AutomationError } from "./status/automation-error";
