"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  BellRing,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Gavel,
  Clock,
  Filter,
  ExternalLink,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_NOTIFICATIONS } from "@/lib/lawmate/data";
import { relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<string, any> = {
  analysis: Sparkles,
  task: CheckCircle2,
  matter: Gavel,
  research: CheckCircle2,
  ai: Sparkles,
  system: Bell,
  security: AlertTriangle,
};

const KIND_BADGE: Record<string, string> = {
  analysis: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  task: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  matter: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  research: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ai: "bg-primary/10 text-primary border-primary/20",
  system: "bg-muted text-muted-foreground",
  security: "bg-red-500/10 text-red-500 border-red-500/20",
};

const KIND_HREF = (kind: string): string => {
  switch (kind) {
    case "ai":
    case "analysis":
      return "/legalai/assistant";
    case "task":
      return "/legalai/tasks";
    case "matter":
      return "/legalai/matters";
    case "research":
      return "/legalai/research";
    case "security":
      return "/legalai/settings/security";
    case "system":
    default:
      return "/legalai/settings/notifications";
  }
};

export default function NotificationsPage() {
  const [filter, setFilter] = useState<"all" | "unread" | "ai" | "task" | "matter" | "system">("all");

  const filtered = MOCK_NOTIFICATIONS.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    if (filter === "ai") return n.kind === "ai" || n.kind === "analysis";
    return n.kind === filter;
  });

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Bell className="size-5 text-primary" />
              Notifications
            </h1>
            <p className="text-sm text-muted-foreground">
              AI job completions, task assignments, and system events.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() =>
                toast.success(`${unreadCount} notification${unreadCount === 1 ? "" : "s"} marked as read`)
              }
              disabled={unreadCount === 0}
            >
              <CheckCircle2 className="size-4" /> Mark all read
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Stat label="Total" value={MOCK_NOTIFICATIONS.length} icon={Bell} accent="bg-primary/10 text-primary" />
          <Stat label="Unread" value={unreadCount} icon={BellRing} accent="bg-blue-500/10 text-blue-500" />
          <Stat label="AI jobs" value={MOCK_NOTIFICATIONS.filter((n) => n.kind === "ai" || n.kind === "analysis").length} icon={Sparkles} accent="bg-violet-500/10 text-violet-500" />
          <Stat label="Tasks" value={MOCK_NOTIFICATIONS.filter((n) => n.kind === "task").length} icon={CheckCircle2} accent="bg-amber-500/10 text-amber-500" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "unread", "ai", "task", "matter", "system"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs capitalize transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bell className="size-8 text-muted-foreground opacity-40 mb-3" />
                <p className="font-medium">No notifications</p>
                <p className="text-sm text-muted-foreground mt-1">You&rsquo;re all caught up.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((n) => {
                  const Icon = KIND_ICON[n.kind] ?? Bell;
                  const href = n.href ?? KIND_HREF(n.kind);
                  return (
                    <Link
                      key={n.id}
                      href={href}
                      className={cn(
                        "flex items-start gap-3 rounded-md border p-3 transition-colors",
                        !n.read ? "bg-primary/5 border-primary/20" : "bg-card/30",
                        "hover:bg-accent/30",
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{n.title}</p>
                          <Badge variant="outline" className={cn("text-[10px]", KIND_BADGE[n.kind])}>
                            {n.kind}
                          </Badge>
                          {!n.read && (
                            <span className="size-1.5 rounded-full bg-primary" />
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground mt-1">
                          {relativeTime(n.createdAt)}
                        </p>
                      </div>
                      <ExternalLink className="size-3.5 text-muted-foreground shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function Stat({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("rounded-md p-2", accent)}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
