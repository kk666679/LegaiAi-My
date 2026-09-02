"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Activity,
  Eye,
  Bot,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Agent, AgentHeader } from "@/components/ai-elements/agent";
import { AIMetricCard } from "@/components/ai/aimetric-card";
import { AIStatusIndicator } from "@/components/ai/aistatus-indicator";
import { ApprovalRequest, AgentTimeline as AgentTimelineView } from "@/components/ai/legal";

type AgentStatus = "running" | "paused" | "awaiting_approval" | "completed" | "failed";
type StepStatus = "complete" | "active" | "pending" | "failed";

interface AgentRun {
  id: string;
  name: string;
  goal: string;
  status: AgentStatus;
  startedAt: string;
  progress: number;
  steps: Array<{ id: string; label: string; status: StepStatus; detail?: string }>;
  matterName?: string;
}

const MOCK_RUNS: AgentRun[] = [
  {
    id: "run-1",
    name: "PDPA Compliance Audit",
    goal: "Audit all matter documents for PDPA Section 7 compliance.",
    status: "awaiting_approval",
    startedAt: "2026-09-01T14:30:00Z",
    progress: 75,
    matterName: "DataShield — PDPA Audit",
    steps: [
      { id: "s1", label: "Retrieve matter documents", status: "complete", detail: "18 documents indexed" },
      { id: "s2", label: "Extract personal data references", status: "complete", detail: "42 references found" },
      { id: "s3", label: "Cross-reference PDPA s.7", status: "complete", detail: "7 potential gaps identified" },
      { id: "s4", label: "Draft remediation plan", status: "active", detail: "In progress…" },
      { id: "s5", label: "Submit for human review", status: "pending" },
    ],
  },
  {
    id: "run-2",
    name: "Employment Contract Review",
    goal: "Review 3 employment agreements for non-compete enforceability.",
    status: "running",
    startedAt: "2026-09-01T13:00:00Z",
    progress: 45,
    matterName: "TechNova Sdn Bhd — Employment Disputes",
    steps: [
      { id: "s1", label: "Identify employment clauses", status: "complete" },
      { id: "s2", label: "Analyse non-compete terms", status: "complete" },
      { id: "s3", label: "Cross-reference Industrial Court awards", status: "active" },
      { id: "s4", label: "Generate risk report", status: "pending" },
    ],
  },
  {
    id: "run-3",
    name: "Force Majeure Gap Analysis",
    goal: "Identify gaps in force majeure clauses across SPA documents.",
    status: "completed",
    startedAt: "2026-09-01T10:00:00Z",
    progress: 100,
    matterName: "Acquisition: Valley Foods Sdn Bhd",
    steps: [
      { id: "s1", label: "Compare to industry standard", status: "complete" },
      { id: "s2", label: "Identify missing trigger events", status: "complete" },
      { id: "s3", label: "Draft alternative language", status: "complete" },
    ],
  },
  {
    id: "run-4",
    name: "Citation Validation Batch",
    goal: "Validate 12 citations across recent drafts.",
    status: "failed",
    startedAt: "2026-09-01T08:00:00Z",
    progress: 60,
    steps: [
      { id: "s1", label: "Extract citations", status: "complete" },
      { id: "s2", label: "Resolve against LOM index", status: "failed", detail: "Index sync failed" },
      { id: "s3", label: "Generate validation report", status: "pending" },
    ],
  },
];

const STATUS_TO_INDICATOR: Record<AgentStatus, "busy" | "paused" | "warning" | "success" | "error"> = {
  running: "busy",
  paused: "paused",
  awaiting_approval: "warning",
  completed: "success",
  failed: "error",
};

const STATUS_LABEL: Record<AgentStatus, string> = {
  running: "Running",
  paused: "Paused",
  awaiting_approval: "Awaiting approval",
  completed: "Completed",
  failed: "Failed",
};

function stepToTimelineStatus(s: StepStatus): "completed" | "running" | "awaiting_approval" | "failed" | "queued" {
  switch (s) {
    case "complete":
      return "completed";
    case "active":
      return "running";
    case "pending":
      return "queued";
    case "failed":
      return "failed";
  }
}

export default function HITLPage() {
  const [runs, setRuns] = useState<AgentRun[]>(MOCK_RUNS);

  const approve = (id: string) => {
    setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, status: "running", progress: 85 } : r)));
    toast.success(`Approved ${id} — run resumed`);
  };
  const reject = (id: string) => {
    setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, status: "failed", progress: r.progress } : r)));
    toast.error(`Rejected ${id}`);
  };
  const pause = (id: string) => {
    setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, status: "paused" } : r)));
    toast.warning(`Paused ${id}`);
  };
  const retry = (id: string) => {
    setRuns((rs) => rs.map((r) => (r.id === id ? { ...r, status: "running", progress: Math.max(r.progress, 10) } : r)));
    toast.success(`Retrying ${id}`);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              Agent Control (HITL)
            </h1>
            <p className="text-sm text-muted-foreground">
              Human-in-the-loop oversight of AI agent runs. Approve, pause, or intervene at any step.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/legalai/agent">
                <Bot className="size-4" /> View agents
              </Link>
            </Button>
            <Button size="sm" className="gap-2" asChild>
              <Link href="/legalai/assistant">
                <Sparkles className="size-4" /> New agent run
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AIMetricCard
            title="Active runs"
            value={runs.filter((r) => r.status === "running").length}
            icon={Activity}
            description="Currently executing"
          />
          <AIMetricCard
            title="Awaiting approval"
            value={runs.filter((r) => r.status === "awaiting_approval").length}
            icon={Eye}
            description="Need human review"
          />
          <AIMetricCard
            title="Completed today"
            value={runs.filter((r) => r.status === "completed").length}
            icon={CheckCircle2}
            description="Finished successfully"
          />
          <AIMetricCard
            title="Failed"
            value={runs.filter((r) => r.status === "failed").length}
            icon={XCircle}
            description="Require retry"
          />
        </div>

        <div className="space-y-4">
          {runs.map((run) => (
            <Agent key={run.id} className="hover:border-primary/30 transition-colors">
              <AgentHeader name={run.name} model={STATUS_LABEL[run.status]} />
              <div className="space-y-4 p-4 pt-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <AIStatusIndicator
                    status={STATUS_TO_INDICATOR[run.status]}
                    label={STATUS_LABEL[run.status]}
                    size="sm"
                    showPulse={run.status === "running"}
                  />
                  {run.matterName && (
                    <Badge variant="secondary" className="text-[10px]">
                      {run.matterName}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{run.goal}</p>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{run.progress}%</span>
                  </div>
                  <Progress
                    value={run.progress}
                    className={
                      run.status === "failed"
                        ? "[&>div]:bg-red-500"
                        : run.status === "completed"
                        ? "[&>div]:bg-emerald-500"
                        : ""
                    }
                  />
                </div>

                <AgentTimelineView
                  steps={run.steps.map((s) => ({
                    name: s.label,
                    status: stepToTimelineStatus(s.status),
                    description: s.detail,
                  }))}
                />

                {run.status === "awaiting_approval" && (
                  <ApprovalRequest
                    action="Submit remediation plan for filing"
                    agent={run.name}
                    authorizationLevel={3}
                    matter={run.matterName}
                    risk="medium"
                    evidenceCount={3}
                    onApprove={() => approve(run.id)}
                    onReject={() => reject(run.id)}
                  />
                )}

                {run.status !== "awaiting_approval" && (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t">
                    {run.status === "running" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => pause(run.id)}
                      >
                        <Pause className="size-3.5" /> Pause
                      </Button>
                    )}
                    {run.status === "failed" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => retry(run.id)}
                      >
                        <Play className="size-3.5" /> Retry
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="gap-1" asChild>
                      <Link href={`/legalai/agent`}>
                        Details <ArrowRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </Agent>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}