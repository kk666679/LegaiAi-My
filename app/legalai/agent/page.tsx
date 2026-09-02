"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Cpu,
  Play,
  Bot,
  Sparkles,
  BookOpen,
  FileText,
  Gavel,
  ArrowRight,
  Plus,
  Activity,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/components/ai-elements/agent";
import { AIMetricCard } from "@/components/ai/aimetric-card";

const AGENTS = [
  {
    id: "a-1",
    name: "Legal Research Agent",
    desc: "Search statutes, cases and guidelines; synthesise citation-checked answers.",
    icon: BookOpen,
    runs: 42,
    status: "ready",
  },
  {
    id: "a-2",
    name: "Document Reviewer",
    desc: "Extract clauses, identify risks, and draft review notes.",
    icon: FileText,
    runs: 18,
    status: "ready",
  },
  {
    id: "a-3",
    name: "Drafting Assistant",
    desc: "Generate legal drafts from templates with AI assistance.",
    icon: Sparkles,
    runs: 27,
    status: "ready",
  },
  {
    id: "a-4",
    name: "Citation Validator",
    desc: "Validate citations against the LOM index and authoritative sources.",
    icon: Gavel,
    runs: 84,
    status: "ready",
  },
  {
    id: "a-5",
    name: "Risk Analyst",
    desc: "Scan matters for compliance gaps, conflicts and outdated authority.",
    icon: Activity,
    runs: 12,
    status: "ready",
  },
  {
    id: "a-6",
    name: "Debate Simulator",
    desc: "Multi-agent debate to stress-test legal arguments.",
    icon: Bot,
    runs: 4,
    status: "beta",
  },
];

export default function AgentPage() {
  const router = useRouter();
  const runAgent = (id: string, name: string) => {
    toast.success(`Starting ${name}`, {
      description: "You'll be redirected to the assistant with this agent selected.",
    });
    router.push(`/legalai/assistant?agent=${id}`);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Cpu className="size-5 text-primary" />
              AI Copilot
            </h1>
            <p className="text-sm text-muted-foreground">
              Autonomous AI agents that execute multi-step legal workflows with human oversight.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/legalai/hitl">
                <Activity className="size-4" /> View runs
              </Link>
            </Button>
            <Button size="sm" className="gap-2" asChild>
              <Link href="/legalai/assistant">
                <Plus className="size-4" /> New run
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AIMetricCard
            title="Available agents"
            value={AGENTS.length}
            icon={Cpu}
            description="Ready to deploy"
          />
          <AIMetricCard
            title="Total runs"
            value={AGENTS.reduce((a, x) => a + x.runs, 0)}
            icon={Play}
            description="Across all agents"
          />
          <AIMetricCard
            title="Avg. completion"
            value="2.4 min"
            icon={Clock}
            description="Per workflow"
          />
          <AIMetricCard
            title="Success rate"
            value="96%"
            icon={CheckCircle2}
            description="Last 30 days"
            trend={{ value: 4, label: "vs prev. period" }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            return (
              <Agent key={agent.id} className="hover:border-primary/30 transition-colors">
                <div className="flex w-full items-center justify-between gap-4 p-3 border-b">
                  <div className="flex items-center gap-2">
                    <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="size-4" />
                    </div>
                    <span className="font-medium text-sm">{agent.name}</span>
                    <Badge className="font-mono text-xs" variant="secondary">
                      {agent.status === "beta" ? "beta" : `${agent.runs} runs`}
                    </Badge>
                  </div>
                  {agent.status === "beta" && (
                    <Badge variant="outline" className="text-[10px]">Beta</Badge>
                  )}
                </div>
                <div className="space-y-3 p-4 pt-0">
                  <p className="text-sm text-muted-foreground">{agent.desc}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {agent.runs} historical runs
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1"
                      onClick={() => runAgent(agent.id, agent.name)}
                    >
                      Run <ArrowRight className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </Agent>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}