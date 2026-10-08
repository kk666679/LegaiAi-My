// app/lawmate/automations/_components/list-client.tsx
"use client";
import * as React from "react";
import Link from "next/link";
import { Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { WorkflowSearch } from "@/components/automation";
import {
  AutomationLibrary,
  AutomationStatsBar,
  type ViewMode,
  type WorkflowMeta,
  type WorkflowStats,
} from "@/components/automation";
import { trpcReact } from "@/clients";
import { toast } from "sonner";

export function AutomationsListPage() {
  const [view, setView] = React.useState<ViewMode>("grid");
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"draft" | "active" | "paused" | "archived" | undefined>(undefined);
  const [sortBy, setSortBy] = React.useState<"name" | "updatedAt" | "createdAt" | "lastRunAt">("updatedAt");
  const [sortDir, setSortDir] = React.useState<"asc" | "desc">("desc");
  const [categoryFilter, setCategoryFilter] = React.useState<string | undefined>(undefined);
  
  const {
    workflows,
    statsById,
    loading,
    error,
    hasMore,
    nextCursor,
    reload,
  } = useAutomationList({
    query,
    status: statusFilter,
    category: categoryFilter,
    sortBy,
    sortDir,
    limit: 20,
  });

  const handleCreate = () => {
    window.location.href = "/lawmate/automations/new";
  };

  const handleRefresh = () => {
    reload();
  };

  const loadMore = () => {
    // Implementation would require updating the hook to support pagination
    // For now, just refetch with same filters (could be enhanced)
    reload();
  };

  const handleRun = async (workflow: WorkflowMeta) => {
    try {
      await trpcReact.automations.runs.trigger.mutateAsync({
        automationId: workflow.id,
        trigger: "manual",
      });
      toast.success("Workflow triggered");
    } catch (err) {
      toast.error(`Failed to trigger workflow: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  const handleOpen = (w: WorkflowMeta) => {
    window.location.href = `/lawmate/automations/${w.id}/builder`;
  };

  const handleSetStatus = async (workflowId: string, status: WorkflowMeta["status"]) => {
    try {
      await trpcReact.automations.setStatus.mutateAsync({ id: workflowId, status });
      toast.success(`Workflow ${status}`);
      reload();
    } catch (err) {
      toast.error(`Failed to update status: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  const handleDelete = async (workflowId: string) => {
    if (!window.confirm("Delete this workflow? This action cannot be undone.")) return;
    try {
      await trpcReact.automations.remove.mutateAsync({ id: workflowId });
      toast.success("Workflow deleted");
      reload();
    } catch (err) {
      toast.error(`Failed to delete workflow: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <div>
          <h1 className="text-lg font-semibold">Automations</h1>
          <p className="text-xs text-muted-foreground">Design, test, and run legal workflows.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => {
                setStatusFilter(undefined);
                setCategoryFilter(undefined);
                setSortBy("updatedAt");
                setSortDir("desc");
                setQuery("");
                reload();
              }}
            >
              <RefreshCw className="size-3.5" /> Reset filters
            </Button>
          </div>
          <div className="relative">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              asChild
            >
              <Link href="/lawmate/automations/new"><Plus className="size-3.5" />New workflow</Link>
            </Button>
          </div>
        </div>
      </header>
      
      {loading && workflows.length === 0 ? (
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Loading automations…</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <WorkflowSearch value={query} onChange={setQuery} />
            <div className="flex items-center gap-2">
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Status: {statusFilter ?? "All"}
                      <span className="ml-1 text-xs">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={4} collisionPadding={4} align="start">
                    <DropdownMenuItem onClick={() => setStatusFilter(undefined)}>
                      All
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
                      Draft
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("active")}>
                      Active
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("paused")}>
                      Paused
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setStatusFilter("archived")}>
                      Archived
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Category: {categoryFilter ?? "All"}
                      <span className="ml-1 text-xs">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={4} collisionPadding={4} align="start">
                    <DropdownMenuItem onClick={() => setCategoryFilter(undefined)}>
                      All
                    </DropdownMenuItem>
                    {/* Categories would need to be fetched from backend or inferred from data */}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <div className="relative">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      Sort: {sortBy} {sortDir === "asc" ? "↑" : "↓"}
                      <span className="ml-1 text-xs">▼</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent sideOffset={4} collisionPadding={4} align="start">
                    <DropdownMenuItem onClick={() => {
                      setSortBy("name");
                      setSortDir("asc");
                    }}>
                      Name A-Z
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortBy("name");
                      setSortDir("desc");
                    }}>
                      Name Z-A
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortBy("updatedAt");
                      setSortDir("desc");
                    }}>
                      Recently Updated
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortBy("createdAt");
                      setSortDir("desc");
                    }}>
                      Recently Created
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => {
                      setSortBy("lastRunAt");
                      setSortDir("desc");
                    }}>
                      Recently Run
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {error ? (
            <div role="alert" className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive w-full">
              {error}
            </div>
          ) : (
            workflows.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6">
                <p className="text-sm text-muted-foreground">
                  No automations match your filters. Try clearing filters or creating a new workflow.
                </p>
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <AutomationStatsBar 
                  stats={{ 
                    total: workflows.length, 
                    active: workflows.filter((w: WorkflowMeta) => w.status === "active").length,
                    draft: workflows.filter((w: WorkflowMeta) => w.status === "draft").length,
                    runs24h: 0, // Would need real-time data
                    successRate: Object.values(statsById).reduce((sum: number, stats: WorkflowStats) => sum + stats.successRate, 0) / Math.max(1, Object.values(statsById).length)
                  }} 
                />
                <div className="space-y-4">
                  <AutomationLibrary
                    workflows={workflows}
                    statsById={statsById}
                    view={view}
                    onViewChange={setView}
                    onOpen={handleOpen}
                    onRun={handleRun}
                    onMenu={(w, anchor) => {
                      // Context menu would go here - simplified for now
                      // In a full implementation, this would open a dropdown menu with actions
                    }}
                    emptyAction={{ 
                      label: "Create workflow", 
                      onClick: handleCreate 
                    }}
                  />
                </div>
                {hasMore && (
                  <div className="text-center py-4">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={loadMore}
                    >
                      Load more
                    </Button>
                  </div>
                )}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}

// Custom hook to replace the mock useAutomationList with tRPC-backed version
function useAutomationList(options?: {
  query?: string;
  status?: "draft" | "active" | "paused" | "archived" | undefined;
  category?: string | undefined;
  sortBy?: "name" | "updatedAt" | "createdAt" | "lastRunAt";
  sortDir?: "asc" | "desc";
  limit?: number;
}) {
  const query = trpcReact.automations.list.useQuery(
    {
      query: options?.query,
      status: options?.status,
      category: options?.category,
      sortBy: options?.sortBy ?? "updatedAt",
      sortDir: options?.sortDir ?? "desc",
      limit: options?.limit ?? 20,
    },
    { refetchOnWindowFocus: false }
  );

  const workflows = React.useMemo(() => 
    (query.data?.items ?? []).map((a: any) => ({
      id: a.id,
      name: a.name,
      description: a.description ?? undefined,
      category: a.category ?? undefined,
      status: a.status as WorkflowMeta["status"],
      ownerId: undefined,
      ownerName: undefined,
      matterId: undefined,
      tags: a.tags,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    })), 
    [query.data?.items]
  );

  const statsById = React.useMemo<Record<string, WorkflowStats>>(() => {
    const map: Record<string, WorkflowStats> = {};
    for (const a of query.data?.items ?? []) {
      map[a.id] = {
        totalRuns: a.totalRuns,
        successRate: a.successRate ?? 0,
        avgDurationMs: 0, // Would need separate query or enhancement
        lastRunAt: a.lastRunAt ?? undefined,
        activeRuns: a.activeRuns ?? 0,
      };
    }
    return map;
  }, [query.data?.items]);

   return {
     workflows,
     statsById,
     loading: query.isLoading,
     error: (query.error as Error | undefined)?.message ?? null,
     hasMore: query.data?.hasMore ?? false,
     nextCursor: query.data?.nextCursor,
     reload: query.refetch,
   };
}