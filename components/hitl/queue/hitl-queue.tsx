// components/hitl/queue/hitl-queue.tsx
"use client";

import * as React from "react";
import { LayoutGrid, List, Rows3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { HITLRequest, HITLViewMode } from "../types";
import { HITLRequestCard } from "../item/hitl-request-card";
import { HITLRequestRow } from "../item/hitl-requset-row";
import { HITLEmpty } from "../status/hitl-empty";
import { HITLLoading } from "../status/hitl-loading";

export interface HITLQueueProps {
  requests: HITLRequest[];
  loading?: boolean;
  view?: HITLViewMode;
  onViewChange?: (v: HITLViewMode) => void;
  onOpen?: (r: HITLRequest) => void;
  selectedId?: string | null;
  groupBy?: (r: HITLRequest) => string;
}

export function HITLQueue({
  requests,
  loading,
  view = "list",
  onViewChange,
  onOpen,
  selectedId,
  groupBy,
}: HITLQueueProps) {
  if (loading) return <HITLLoading variant="list" />;
  if (!requests.length) return <HITLEmpty />;

  const groups = React.useMemo(() => {
    if (!groupBy) return [{ key: "__all__", items: requests }];
    const map = new Map<string, HITLRequest[]>();
    for (const r of requests) {
      const k = groupBy(r);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(r);
    }
    return [...map.entries()].map(([key, items]) => ({ key, items }));
  }, [requests, groupBy]);

  return (
    <div className="space-y-3">
      {onViewChange ? (
        <div className="flex justify-end">
          <Tabs value={view} onValueChange={(v) => onViewChange(v as HITLViewMode)}>
            <TabsList>
              <TabsTrigger value="list" aria-label="List view">
                <Rows3 className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <LayoutGrid className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="kanban" aria-label="Kanban view">
                <List className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}

      {view === "kanban" && groupBy ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 lg:grid-cols-4">
          {groups.map(({ key, items }) => (
            <section key={key} className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {key} ({items.length})
              </h3>
              <div className="space-y-2">
                {items.map((r) => (
                  <HITLRequestCard
                    key={r.id}
                    request={r}
                    onOpen={onOpen}
                    selected={r.id === selectedId}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {requests.map((r) => (
            <HITLRequestCard
              key={r.id}
              request={r}
              onOpen={onOpen}
              selected={r.id === selectedId}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {requests.map((r) => (
            <HITLRequestRow
              key={r.id}
              request={r}
              onOpen={onOpen}
              selected={r.id === selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}