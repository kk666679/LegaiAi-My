"use client";

import { useState } from "react";
import {
  Briefcase,
  Users,
  Clock,
  AlertTriangle,
  Bot,
  Search,
  Filter,
  ChevronRight,
  Activity,
  MessageSquare,
  FileText,
  CheckCircle2,
  CircleDot,
  FileSignature,
  BookOpen,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { MOCK_MATTERS, MOCK_TASKS, MOCK_RISKS } from "@/lib/lawmate/data";
import { relativeTime, severityClasses } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";
import type { Matter, TaskStatus } from "@/types/lawmate";
import { CreateMatterDialog } from "@/components/lawmate/CreateMatterDialog";

const STATUS_BADGE: Record<Matter["status"], string> = {
  active: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  review: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  completed: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground",
};

const TASK_STATUS_ICON: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  todo: CircleDot,
  in_progress: Activity,
  blocked: AlertTriangle,
  done: CheckCircle2,
};

export default function MattersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<string>(MOCK_MATTERS[0]?.id ?? "");
  const [matters, setMatters] = useState(MOCK_MATTERS);
  const [mobileDetail, setMobileDetail] = useState(false);

  const filtered = matters.filter((m) => {
    if (statusFilter !== "all" && m.status !== statusFilter) return false;
    if (
      search &&
      !m.name.toLowerCase().includes(search.toLowerCase()) &&
      !(m.client ?? "").toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const matter = matters.find((m) => m.id === selected);
  const matterTasks = MOCK_TASKS.filter((t) => t.matterId === selected);
  const matterRisks = MOCK_RISKS.filter((r) => r.matterId === selected);

  const handleSelect = (id: string) => {
    setSelected(id);
    setMobileDetail(true);
  };

  const DetailContent = matter && (
    <div className="space-y-4 p-4 lg:p-0">
      <div>
        <p className="text-xs text-muted-foreground">Matter</p>
        <h3 className="text-lg font-semibold leading-tight">{matter.name}</h3>
        <div className="flex items-center gap-2 flex-wrap mt-2 text-xs">
          <Badge variant="secondary">{matter.number}</Badge>
          <Badge variant="outline">{matter.area}</Badge>
          <Badge variant="outline">{matter.classification}</Badge>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {matter.description}
      </p>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <DetailRow label="Status" value={matter.status} />
        <DetailRow label="Priority" value={matter.priority} />
        <DetailRow label="Client" value={matter.client ?? "—"} />
        <DetailRow label="Updated" value={relativeTime(matter.updatedAt)} />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Tasks ({matterTasks.length})
        </p>
        {matterTasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tasks yet.</p>
        ) : (
          matterTasks.slice(0, 4).map((t) => {
            const Icon = TASK_STATUS_ICON[t.status];
            return (
              <div
                key={t.id}
                className="flex items-center gap-2 rounded-md border p-2 text-xs"
              >
                <Icon
                  className={cn(
                    "size-3.5 shrink-0",
                    t.status === "done" && "text-emerald-500",
                    t.status === "in_progress" && "text-primary",
                    t.status === "blocked" && "text-red-500",
                    t.status === "todo" && "text-muted-foreground",
                  )}
                />
                <span className="flex-1 truncate">{t.title}</span>
                <span className="text-muted-foreground">
                  {relativeTime(t.dueDate ?? "")}
                </span>
              </div>
            );
          })
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          AI Risk Summary ({matterRisks.length})
        </p>
        {matterRisks.slice(0, 3).map((r) => {
          const s = severityClasses(r.severity);
          return (
            <div
              key={r.id}
              className={cn("rounded-md border p-2 text-xs", s.border, s.bg)}
            >
              <div className="flex items-center gap-2">
                <span className={cn("size-1.5 rounded-full", s.dot)} />
                <span className="font-medium">{r.title}</span>
              </div>
              <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                {r.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Matters</h1>
            <p className="text-sm text-muted-foreground">
              Manage legal matters with AI-powered insights.
            </p>
          </div>
          <CreateMatterDialog onCreate={(m) => setMatters((cur) => [m, ...cur])} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={Briefcase}
            label="Active matters"
            value={matters.filter((m) => m.status === "active").length}
            accent="bg-primary/10 text-primary"
          />
          <StatCard
            icon={AlertTriangle}
            label="High priority"
            value={matters.filter((m) => m.priority === "high").length}
            accent="bg-red-500/10 text-red-500"
          />
          <StatCard
            icon={Clock}
            label="In review"
            value={matters.filter((m) => m.status === "review").length}
            accent="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            icon={Bot}
            label="AI analyses run"
            value={12}
            accent="bg-violet-500/10 text-violet-500"
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search matters…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-auto text-xs">
                  <Filter className="size-3" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {filtered.map((m) => {
                  const priorityColor =
                    m.priority === "high"
                      ? "text-red-500 border-red-500/30 bg-red-500/10"
                      : m.priority === "medium"
                      ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                      : "text-blue-500 border-blue-500/30 bg-blue-500/10";
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelect(m.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-md border p-3 text-left transition-colors",
                        selected === m.id
                          ? "border-primary/50 bg-primary/5"
                          : "hover:bg-accent/40",
                      )}
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Briefcase className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold leading-tight truncate">
                            {m.name}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {m.number}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px]", priorityColor)}
                          >
                            {m.priority} priority
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] hidden sm:inline-flex", STATUS_BADGE[m.status])}
                          >
                            {m.status}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground truncate">
                          {m.client && (
                            <span className="inline-flex items-center gap-1">
                              <Users className="size-3" /> {m.client}
                            </span>
                          )}
                          {m.client && " · "}
                          <span>{m.area}</span>
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                          <span className="inline-flex items-center gap-1">
                            <FileText className="size-3" /> {m.documentsCount} docs
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="size-3" /> {m.conversationsCount} chats
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> {m.tasksCount} tasks
                          </span>
                          <span className="ml-auto">{relativeTime(m.updatedAt)}</span>
                        </div>
                      </div>
                      <ChevronRight className="mt-2 size-4 text-muted-foreground shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Desktop detail */}
          <Card className="hidden lg:block self-start sticky top-20">
            {DetailContent}
          </Card>

          {/* Mobile detail drawer */}
          <Drawer open={mobileDetail} onOpenChange={setMobileDetail}>
            <DrawerTrigger asChild>
              <span className="hidden" />
            </DrawerTrigger>
            <DrawerContent className="max-h-[85vh]">
              <div className="overflow-y-auto p-4">{DetailContent}</div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </DashboardShell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="capitalize">{value}</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border py-12 text-center">
      <Briefcase className="size-8 text-muted-foreground opacity-40 mb-3" />
      <p className="font-medium">No matters yet</p>
      <p className="text-sm text-muted-foreground max-w-sm mt-1">
        Create your first matter to organise documents, research, conversations
        and tasks in one workspace.
      </p>
      <div className="mt-4">
        <CreateMatterDialog />
      </div>
    </div>
  );
}