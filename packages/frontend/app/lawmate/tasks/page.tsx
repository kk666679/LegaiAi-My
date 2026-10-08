"use client";

import * as React from "react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CheckCircle2, Database, Edit3 as Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useLocalTasks } from "@/hooks/useLocalTasks";
import {
  TASK_ASSIGNEES,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  createTaskId,
  daysUntil,
  isOverdue,
} from "@/lib/lawmate/tasks";
import type { MatterPriority, MatterTaskStatus } from "@/components/matters/types";
import type { WorkspaceTask } from "@/lib/lawmate/tasks";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<MatterTaskStatus, string> = {
  todo: "bg-muted text-muted-foreground border-border",
  "in-progress": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  blocked: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
  review: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  done: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const PRIORITY_BADGE: Record<MatterPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300",
  high: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300",
  urgent: "bg-red-100 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300",
};

const STAT_CARDS = [
  { label: "Open tasks", key: "open" as const, hint: "Not done or cancelled", danger: false },
  { label: "In progress", key: "inProgress" as const, hint: "Actively being worked", danger: false },
  { label: "Overdue", key: "overdue" as const, hint: "Past due date", danger: true },
  { label: "Completed", key: "done" as const, hint: "Done", danger: false },
] as const;

type DraftTask = {
  title: string;
  description: string;
  status: MatterTaskStatus;
  priority: MatterPriority;
  assignee: string;
  dueAt: string;
};

const EMPTY_DRAFT: DraftTask = {
  title: "",
  description: "",
  status: "todo",
  priority: "normal",
  assignee: "",
  dueAt: "",
};

function DueLabel({ task }: { task: WorkspaceTask }) {
  if (!task.dueAt) {
    return <span className="text-xs text-muted-foreground">No due date</span>;
  }
  const d = daysUntil(task.dueAt);
  const date = new Date(task.dueAt);
  const formatted = Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const overdue = isOverdue(task);
  const today = d === 0;
  return (
    <span
      className={cn(
        "text-xs",
        overdue
          ? "font-medium text-red-600"
          : today
            ? "font-medium text-amber-600"
            : "text-muted-foreground",
      )}
    >
      {formatted}
      {overdue ? " · overdue" : today ? " · today" : null}
    </span>
  );
}

export default function TasksPage() {
  const { tasks, addTask, updateTask, removeTask } = useLocalTasks();

  const [search, setSearch] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<MatterTaskStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = React.useState<MatterPriority | "all">("all");
  const [assigneeFilter, setAssigneeFilter] = React.useState<string>("all");

  const [editorOpen, setEditorOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftTask>(EMPTY_DRAFT);
  const [formError, setFormError] = React.useState("");

  const [detailId, setDetailId] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const detailTask = tasks.find((t) => t.id === detailId) ?? null;

  const openCreate = React.useCallback(() => {
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFormError("");
    setEditorOpen(true);
  }, []);

  const openEdit = React.useCallback(
    (t: WorkspaceTask) => {
      setEditingId(t.id);
      setDraft({
        title: t.title,
        description: t.description ?? "",
        status: t.status,
        priority: t.priority,
        assignee: t.assignee ?? "",
        dueAt: t.dueAt ? t.dueAt.slice(0, 10) : "",
      });
      setFormError("");
      setEditorOpen(true);
      setDetailId(null);
    },
    [],
  );

  const openDetail = React.useCallback((taskId: string) => {
    setEditorOpen(false);
    setDetailId(taskId);
  }, []);

  const closeEditor = React.useCallback(() => setEditorOpen(false), []);

  const saveDraft = React.useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const title = draft.title.trim();
      if (!title) {
        setFormError("Title is required.");
        return;
      }

      let dueIso: string | undefined;
      if (draft.dueAt) {
        const parsed = new Date(`${draft.dueAt}T23:59:59`);
        if (Number.isNaN(parsed.getTime())) {
          setFormError("Due date is not a valid date.");
          return;
        }
        dueIso = parsed.toISOString();
      }

      if (editingId) {
        updateTask(editingId, {
          title,
          description: draft.description.trim() || undefined,
          status: draft.status,
          priority: draft.priority,
          assignee: draft.assignee || undefined,
          dueAt: dueIso,
        });
        toast.success("Task updated");
      } else {
        const now = new Date().toISOString();
        addTask({
          id: createTaskId(),
          title,
          description: draft.description.trim() || undefined,
          status: draft.status,
          priority: draft.priority,
          assignee: draft.assignee || undefined,
          dueAt: dueIso,
          createdAt: now,
          updatedAt: now,
          sample: false,
        });
        toast.success("Task created");
      }

      setFormError("");
      setEditorOpen(false);
    },
    [draft, editingId, addTask, updateTask],
  );

  const taskToDelete = tasks.find((t) => t.id === deleteId) ?? null;

  const confirmDelete = React.useCallback(() => {
    if (!taskToDelete) return;
    removeTask(taskToDelete.id);
    if (detailId === taskToDelete.id) setDetailId(null);
    setDeleteId(null);
    toast.success("Task deleted");
  }, [taskToDelete, detailId, removeTask]);

  const assignees = React.useMemo(() => {
    const fromTasks = tasks.map((t) => t.assignee).filter(Boolean) as string[];
    return Array.from(new Set([...TASK_ASSIGNEES, ...fromTasks]));
  }, [tasks]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return tasks
      .filter((t) => {
        if (statusFilter !== "all" && t.status !== statusFilter) return false;
        if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
        if (assigneeFilter !== "all" && (t.assignee ?? "") !== assigneeFilter) return false;
        if (!q) return true;
        return (
          t.title.toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q) ||
          (t.assignee ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
        if (a.dueAt) return -1;
        if (b.dueAt) return 1;
        return b.createdAt.localeCompare(a.createdAt);
      });
  }, [tasks, search, statusFilter, priorityFilter, assigneeFilter]);

  const stats = React.useMemo(() => {
    return {
      open: tasks.filter((t) => t.status !== "done" && t.status !== "cancelled").length,
      inProgress: tasks.filter((t) => t.status === "in-progress").length,
      overdue: tasks.filter((t) => isOverdue(t)).length,
      done: tasks.filter((t) => t.status === "done").length,
    };
  }, [tasks]);

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    priorityFilter !== "all" ||
    assigneeFilter !== "all";

  const clearFilters = React.useCallback(() => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setAssigneeFilter("all");
  }, []);

  React.useEffect(() => {
    if (detailId && !detailTask) {
      setDetailId(null);
    }
  }, [detailId, detailTask]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Tasks"
          description="Track legal tasks, reviews and deadlines across your workspace."
          actions={
            <Button onClick={openCreate} className="gap-2">
              <Plus className="size-4" aria-hidden="true" /> New task
            </Button>
          }
        />

        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Database className="size-3.5" aria-hidden="true" />
          Tasks are stored locally in this browser — no backend task service is
          configured, so they are not synced across devices or teammates.
        </p>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {STAT_CARDS.map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tabular-nums",
                    s.danger && stats[s.key] > 0 && "text-red-600",
                  )}
                >
                  {stats[s.key]}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.hint}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks, descriptions or assignees…"
              className="pl-9"
              aria-label="Search tasks"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:w-auto lg:shrink-0">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as MatterTaskStatus | "all")}
            >
              <SelectTrigger className="w-full" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {TASK_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {TASK_STATUS_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priorityFilter}
              onValueChange={(v) => setPriorityFilter(v as MatterPriority | "all")}
            >
              <SelectTrigger className="w-full" aria-label="Filter by priority">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All priorities</SelectItem>
                {TASK_PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {TASK_PRIORITY_LABELS[p]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-full" aria-label="Filter by assignee">
                <SelectValue placeholder="Assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All assignees</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 p-6 text-center">
                <CheckCircle2 className="size-8 text-muted-foreground" aria-hidden="true" />
                <p className="font-medium">
                  {hasFilters ? "No tasks match your filters" : "No tasks yet"}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {hasFilters
                    ? "Try adjusting the search or filters to find what you are looking for."
                    : "Create your first task to start tracking work across the workspace."}
                </p>
                {hasFilters ? (
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={openCreate} className="gap-1.5">
                    <Plus className="size-4" aria-hidden="true" /> New task
                  </Button>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead className="hidden sm:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Priority</TableHead>
                    <TableHead className="hidden lg:table-cell">Assignee</TableHead>
                    <TableHead className="hidden sm:table-cell">Due</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => openDetail(task.id)}
                          className="text-left font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                        >
                          {task.title}
                        </button>
                        {task.description && (
                          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                            {task.description}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-2 sm:hidden">
                          <Badge variant="outline" className={cn("text-[10px]", STATUS_BADGE[task.status])}>
                            {TASK_STATUS_LABELS[task.status]}
                          </Badge>
                          <DueLabel task={task} />
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge variant="outline" className={cn("text-xs", STATUS_BADGE[task.status])}>
                          {TASK_STATUS_LABELS[task.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline" className={cn("text-xs", PRIORITY_BADGE[task.priority])}>
                          {TASK_PRIORITY_LABELS[task.priority]}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden text-sm lg:table-cell">
                        {task.assignee ?? <span className="text-muted-foreground">Unassigned</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <DueLabel task={task} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label={`Edit ${task.title}`} onClick={() => openEdit(task)}>
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label={`Delete ${task.title}`} onClick={() => setDeleteId(task.id)}>
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent>
          <form onSubmit={saveDraft}>
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit task" : "New task"}</DialogTitle>
              <DialogDescription>{editingId ? "Update the task details." : "Create a new task to track."}</DialogDescription>
            </DialogHeader>

            {formError && <p className="text-sm text-destructive">{formError}</p>}

            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="draft-title">Title</label>
                <Input
                  id="draft-title"
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="What needs to be done?"
                  aria-label="Task title"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="draft-description">Description</label>
                <textarea
                  id="draft-description"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  rows={3}
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  placeholder="Add details..."
                  aria-label="Task description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as MatterTaskStatus }))}>
                    <SelectTrigger aria-label="Status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select value={draft.priority} onValueChange={(v) => setDraft((d) => ({ ...d, priority: v as MatterPriority }))}>
                    <SelectTrigger aria-label="Priority"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{TASK_PRIORITY_LABELS[p]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Assignee</label>
                <Select value={draft.assignee || "__unassigned"} onValueChange={(v) => setDraft((d) => ({ ...d, assignee: v === "__unassigned" ? "" : v }))}>
                  <SelectTrigger aria-label="Assignee"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__unassigned">Unassigned</SelectItem>
                    {assignees.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium" htmlFor="draft-due">Due date</label>
                <Input id="draft-due" type="date" value={draft.dueAt} onChange={(e) => setDraft((d) => ({ ...d, dueAt: e.target.value }))} aria-label="Due date" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setEditorOpen(false)}>Cancel</Button>
              <Button type="submit">{editingId ? "Update" : "Create"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailId} onOpenChange={() => setDetailId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{detailTask?.title ?? "Task details"}</DialogTitle>
            <DialogDescription>{detailTask?.description ?? "No description provided."}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 py-2">
            <Badge variant="outline" className={STATUS_BADGE[detailTask?.status ?? "todo"]}>
              {detailTask ? TASK_STATUS_LABELS[detailTask.status] : ""}
            </Badge>
            <Badge variant="outline" className={PRIORITY_BADGE[detailTask?.priority ?? "normal"]}>
              {detailTask ? TASK_PRIORITY_LABELS[detailTask.priority] : ""}
            </Badge>
          </div>
          {detailTask?.dueAt && <DueLabel task={detailTask} />}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setDetailId(null)}>Close</Button>
            {detailTask && (
              <Button variant="ghost" size="sm" onClick={() => { setDetailId(null); openEdit(detailTask); }}>
                <Pencil className="size-4" /> Edit
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone. The task &quot;{taskToDelete?.title}&quot; will be removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardShell>
  );
}
