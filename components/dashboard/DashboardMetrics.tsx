"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Agent, AgentHeader, AgentContent } from "@/components/ai-elements/agent";

interface AgentMetric {
  name: string;
  status: "healthy" | "warning" | "error";
  value: string | number;
  description: string;
  progress?: number;
}

interface DashboardMetricsProps {
  metrics?: AgentMetric[];
  totalJobs?: number;
  successRate?: number;
  avgLatency?: string;
}

const defaultMetrics: AgentMetric[] = [
  {
    name: "Queue Health",
    status: "healthy",
    value: "Optimal",
    description: "All workers active",
    progress: 100,
  },
  {
    name: "Cases Indexed",
    status: "healthy",
    value: "12.4k",
    description: "Federal Court cases in RAG",
  },
  {
    name: "Processing Queue",
    status: "healthy",
    value: "3",
    description: "Jobs in progress",
    progress: 60,
  },
  {
    name: "Avg Latency",
    status: "healthy",
    value: "2.3s",
    description: "Average response time",
  },
];

function getStatusConfig(status: AgentMetric["status"]) {
  const configs = {
    healthy: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-500/10" },
    warning: { icon: AlertCircle, color: "text-yellow-600", bg: "bg-yellow-500/10" },
    error: { icon: AlertCircle, color: "text-red-600", bg: "bg-red-500/10" },
  };
  return configs[status];
}

export function DashboardMetrics({
  metrics = defaultMetrics,
  totalJobs = 127,
  successRate = 99.2,
  avgLatency = "2.3s",
}: DashboardMetricsProps) {
  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Jobs Today</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJobs}</div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground">Overall accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgLatency}</div>
            <p className="text-xs text-muted-foreground">Response time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30">
                Operational
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">All systems online</p>
          </CardContent>
        </Card>
      </div>

      {/* Agent Metrics */}
      <Agent>
        <AgentHeader name="Agent Swarm Status" model="monitoring" />
        <AgentContent>
          <div className="space-y-4">
            {metrics.map((metric) => {
              const statusConfig = getStatusConfig(metric.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={metric.name}
                  className={`p-4 rounded-lg border ${statusConfig.bg}`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex items-start gap-3 flex-1">
                      <StatusIcon
                        className={`h-4 w-4 mt-0.5 ${statusConfig.color}`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm">{metric.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {metric.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-lg font-semibold">{metric.value}</div>
                    </div>
                  </div>
                  {metric.progress !== undefined && (
                    <Progress value={metric.progress} className="h-1.5" />
                  )}
                </div>
              );
            })}
          </div>
        </AgentContent>
      </Agent>
    </div>
  );
}
