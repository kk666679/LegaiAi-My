"use client";

import { ChainOfThought, ChainOfThoughtContent, ChainOfThoughtHeader, ChainOfThoughtStep } from "@/components/ai-elements/chain-of-thought";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell, TrendingUp, Send, Shield, CheckCircle, Clock, Database } from "lucide-react";

interface MonitoringWorkflowProps {
  currentAction: string;
  userId: string;
}

const actions = [
  {
    id: "subscribe",
    title: "Subscribe to Topics",
    description: "Register for alerts on specific legal topics",
    icon: Bell,
    tool: "legal_monitor (subscribe)",
    rules: ["Requires userId", "Requires at least one topic", "Stored in Redis"],
  },
  {
    id: "detect_trend",
    title: "Detect Trends",
    description: "Analyze numeric series for rising/falling patterns",
    icon: TrendingUp,
    tool: "legal_monitor (detect_trend)",
    rules: ["Minimum 5 data points", "Uses TF.js tensor mean", "Rising: > mean × 1.2", "Falling: < mean × 0.8"],
  },
  {
    id: "send_alert",
    title: "Send Alert",
    description: "Broadcast legal alerts to subscribers",
    icon: Send,
    tool: "legal_monitor (send_alert)",
    rules: ["Confidence ≥ 0.9 required", "Deduplication: 4h delay", "LLM summary generation", "Logs only (no external channels)"],
  },
];

export function MonitoringWorkflow({ currentAction, userId }: MonitoringWorkflowProps) {
  const activeAction = actions.find(a => a.id === currentAction) ?? actions[0]!;

  return (
    <div className="space-y-4">
      <ChainOfThought defaultOpen>
        <ChainOfThoughtHeader>Monitoring Workflow</ChainOfThoughtHeader>
        <ChainOfThoughtContent>
          {actions.map((action) => {
            const isActive = currentAction === action.id;
            const Icon = action.icon;
            return (
              <ChainOfThoughtStep
                key={action.id}
                icon={Icon}
                label={
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{action.title}</span>
                    <Badge variant="outline" className="text-xs">{action.tool}</Badge>
                  </div>
                }
                description={action.description}
                status={isActive ? "active" : "pending"}
              >
                <div className="mt-2 space-y-1">
                  {action.rules.map((rule, index) => (
                    <div key={index} className="flex items-start gap-1 text-xs text-muted-foreground">
                      <CheckCircle className="size-3 mt-0.5 text-green-500" />
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </ChainOfThoughtStep>
            );
          })}
        </ChainOfThoughtContent>
      </ChainOfThought>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Shield className="size-4" />
            System Constraints
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Database className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Data Requirements</span>
                <p className="text-xs text-muted-foreground">Trend detection requires minimum 5 numeric values</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Shield className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Confidence Gate</span>
                <p className="text-xs text-muted-foreground">Alerts suppressed if confidence &lt; 0.9</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="size-4 text-muted-foreground mt-0.5" />
              <div>
                <span className="font-medium">Deduplication</span>
                <p className="text-xs text-muted-foreground">Same title blocked for 4 hours</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Notification Channels</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">In-App</span>
            <Badge variant="outline" className="text-green-600">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Email</span>
            <Badge variant="secondary">Configuration Required</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Telegram</span>
            <Badge variant="secondary">Configuration Required</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Session Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">User ID</span>
            <Badge variant="outline" className="font-mono" suppressHydrationWarning>
              {userId.slice(0, 12)}...
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Action</span>
            <Badge>{activeAction.id}</Badge>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Bell className="size-4" />
        <AlertDescription className="text-xs">
          Alerts are currently logged only. Email/Telegram delivery requires additional channel configuration.
        </AlertDescription>
      </Alert>
    </div>
  );
}
