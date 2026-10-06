import type {
  DashboardStatus,
  QueryStatus,
  Workflow,
  WorkflowStatus,
} from "@/components/dashboard/types";
import type {
  ResearchReasoningStep,
  ResearchSession,
  ResearchStatus,
} from "./types";

/* Status mapping */

const SESSION_TO_QUERY_STATUS: Record<ResearchStatus, QueryStatus> = {
  queued: "queued",
  running: "running",
  reasoning: "running",
  complete: "complete",
  failed: "failed",
  cancelled: "failed",
};

const SESSION_TO_DASHBOARD_STATUS: Record<ResearchStatus, DashboardStatus> = {
  queued: "loading",
  running: "loading",
  reasoning: "partial",
  complete: "success",
  failed: "error",
  cancelled: "empty",
};

export function toDashboardStatus(status: ResearchStatus): DashboardStatus {
  return SESSION_TO_DASHBOARD_STATUS[status] ?? "loading";
}

const SESSION_TO_WORKFLOW_STATUS: Record<ResearchStatus, WorkflowStatus> = {
  queued: "queued",
  running: "running",
  reasoning: "running",
  complete: "complete",
  failed: "failed",
  cancelled: "failed",
};

/* Reasoning steps → Workflow */

function reasoningStepStatus(step: ResearchReasoningStep): "pending" | "running" | "complete" {
  switch (step.status) {
    case "complete":
      return "complete";
    case "active":
      return "running";
    default:
      return "pending";
  }
}

/** Map user-facing reasoning steps to a dashboard Workflow. No fake progress. */
export function toDashboardWorkflow(
  session: ResearchSession,
  steps: readonly ResearchReasoningStep[],
): Workflow {
  return {
    id: `workflow-${session.id}`,
    title: session.title || session.query.text,
    status: SESSION_TO_WORKFLOW_STATUS[session.status] ?? "queued",
    query: session.query.text,
    startedAt: session.createdAt,
    completedAt:
      session.status === "complete" || session.status === "failed" ? session.updatedAt : undefined,
    steps: steps.map((step) => ({
      id: step.id,
      key: step.kind,
      title: step.label,
      description: step.detail,
      status: reasoningStepStatus(step),
      agent: "legal-orchestrator",
      sourceIds: step.authorityIds,
    })),
  };
}
