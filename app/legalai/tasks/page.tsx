"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  Clock,
  CheckCircle2,
  CircleDot,
  Loader2,
  XCircle,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { MOCK_TASKS, MOCK_MATTERS } from "@/lib/lawmate/data";
import { isOverdue, relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";
import type { LegalTask, TaskStatus } from "@/types/lawmate";

const STATUS_ICON: Record<TaskStatus, React.ComponentType<{ className?: string }>> = {
  todo: CircleDot,
  in_progress: Loader2,
  blocked: XCircle,
  done: CheckCircle2,
};

const PRIORITY_BADGE: Record<LegalTask["priority"], string> = {
  high: "bg-red-500/10 text-red-500 border-red-500/20",
  medium: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  low: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<LegalTask[]>(MOCK_TASKS);
  const [filter, setFilter] = useState<"all" | "today" | "overdue" | "upcoming" | "completed">("all");
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [draftTask, setDraftTask] = useState<Partial<LegalTask>>({
    title: "",
    matterId: "",
    priority: "medium",
    dueDate: new Date().toISOString().slice(0, 10),
  });

  const filtered = tasks.filter((t) => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (priority !== "all" && t.priority !== priority) return false;
    if (filter === "today") {
      return (
        t.dueDate &&
        new Date(t.dueDate).toDateString() === new Date().toDateString()
      );
    }
    if (filter === "overdue") return isOverdue(t.dueDate) && t.status !== "done";
    if (filter === "upcoming") return t.status === "todo";
    if (filter === "completed") return t.status === "done";
    return true;
  });

  const counts = {
    today: tasks.filter(
      (t) =>
        t.dueDate &&
        new Date(t.dueDate).toDateString() === new Date().toDateString(),
    ).length,
    overdue: tasks.filter((t) => isOverdue(t.dueDate) && t.status !== "done").length,
    upcoming: tasks.filter((t) => t.status === "todo").length,
    completed: tasks.filter((t) => t.status === "done").length,
  };

  const toggleDone = (id: string) =>
    setTasks((cur) =>
      cur.map((t) =>
        t.id === id
          ? {
              ...t,
              status: t.status === "done"
                ? "todo"
                : t.status === "blocked"
                ? "done"
                : "done",
            }
          : t,
      ),
    );

  const deleteTask = (id: string) => {
    setTasks((cur) => cur.filter((t) => t.id !== id));
    toast.success("Task deleted");
  };

  const createTask = () => {
    if (!draftTask.title?.trim()) return;
    const matter = MOCK_MATTERS.find((m) => m.id === draftTask.matterId);
    const newTask: LegalTask = {
      id: `t-${Date.now()}`,
      title: draftTask.title!,
      matterId: draftTask.matterId,
      matterName: matter?.name,
      priority: (draftTask.priority as LegalTask["priority"]) ?? "medium",
      status: "todo",
      dueDate: draftTask.dueDate
        ? new Date(draftTask.dueDate).toISOString()
        : undefined,
    };
    setTasks((cur) => [newTask, ...cur]);
    setDraftTask({ title: "", matterId: "", priority: "medium" });
    setCreateOpen(false);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
            <p className="text-sm text-muted-foreground">
              Track legal work across all matters.
            </p>
          </div>
          <Sheet open={createOpen} onOpenChange={setCreateOpen}>
            <SheetTrigger asChild>
              <Button className="gap-2 self-start md:self-auto">
                <Plus className="size-4" /> New task
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:max-w-md flex flex-col">
              <SheetHeader>
                <SheetTitle>Create task</SheetTitle>
                <SheetDescription>
                  Add a task linked to a matter.
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-4 p-4 flex-1 overflow-y-auto">
                <div>
                  <Label className="text-xs">Task title *</Label>
                  <Input
                    value={draftTask.title ?? ""}
                    onChange={(e) =>
                      setDraftTask((d) => ({ ...d, title: e.target.value }))
                    }
                    placeholder="e.g. Review draft contract"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs">Matter</Label>
                  <Select
                    value={draftTask.matterId ?? ""}
                    onValueChange={(v) =>
                      setDraftTask((d) => ({ ...d, matterId: v }))
                    }
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select matter" />
                    </SelectTrigger>
                    <SelectContent>
                      {MOCK_MATTERS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Priority</Label>
                    <Select
                      value={draftTask.priority ?? "medium"}
                      onValueChange={(v: any) =>
                        setDraftTask((d) => ({ ...d, priority: v }))
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Due date</Label>
                    <Input
                      type="date"
                      value={draftTask.dueDate?.slice(0, 10) ?? ""}
                      onChange={(e) =>
                        setDraftTask((d) => ({
                          ...d,
                          dueDate: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
              <SheetFooter className="border-t p-4">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createTask} disabled={!draftTask.title?.trim()}>
                  Create task
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Due today" value={counts.today} icon={Calendar} tone="primary" />
          <StatTile label="Overdue" value={counts.overdue} icon={AlertTriangle} tone="danger" />
          <StatTile label="Upcoming" value={counts.upcoming} icon={Clock} tone="warning" />
          <StatTile label="Completed" value={counts.completed} icon={CheckCircle2} tone="success" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search tasks…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger className="h-9 w-auto text-xs">
                  <Filter className="size-3" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {(["all", "today", "overdue", "upcoming", "completed"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent",
                  )}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-2">
                {filtered.map((t) => {
                  const Icon = STATUS_ICON[t.status];
                  const overdue = isOverdue(t.dueDate) && t.status !== "done";
                  return (
                    <div
                      key={t.id}
                      className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/30 transition-colors"
                    >
                      <Checkbox
                        checked={t.status === "done"}
                        aria-label="Mark complete"
                        className="mt-0.5"
                        onCheckedChange={() => toggleDone(t.id)}
                      />
                      <Icon
                        className={cn(
                          "mt-0.5 size-4 shrink-0",
                          t.status === "done" && "text-emerald-500",
                          t.status === "in_progress" && "animate-spin text-primary",
                          t.status === "blocked" && "text-red-500",
                          t.status === "todo" && "text-muted-foreground",
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "font-medium text-sm leading-tight",
                            t.status === "done" && "line-through text-muted-foreground",
                          )}
                        >
                          {t.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          {t.matterName && (
                            <span className="truncate">{t.matterName}</span>
                          )}
                          {t.assignee && (
                            <>
                              <span>·</span>
                              <span>{t.assignee}</span>
                            </>
                          )}
                          {t.dueDate && (
                            <>
                              <span>·</span>
                              <span
                                className={cn(overdue && "text-red-500 font-medium")}
                              >
                                Due {relativeTime(t.dueDate)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-[10px] shrink-0", PRIORITY_BADGE[t.priority])}
                      >
                        {t.priority}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm" aria-label="Actions">
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => toggleDone(t.id)}>
                            {t.status === "done" ? "Mark todo" : "Mark complete"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toast.info("Task editing is read-only in this demo", {
                                description: `${t.title} · ${t.matterName ?? "no matter"}`,
                              })
                            }
                          >
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={() => deleteTask(t.id)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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

function StatTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "primary" | "danger" | "warning" | "success";
}) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    danger: "bg-red-500/10 text-red-500",
    warning: "bg-amber-500/10 text-amber-500",
    success: "bg-emerald-500/10 text-emerald-500",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn("rounded-md p-2", tones[tone])}>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <CheckSquare className="size-8 text-muted-foreground opacity-40 mb-3" />
      <p className="font-medium">No tasks</p>
      <p className="text-sm text-muted-foreground mt-1">
        You&rsquo;re all caught up. Create a new task to keep your matters moving.
      </p>
    </div>
  );
}