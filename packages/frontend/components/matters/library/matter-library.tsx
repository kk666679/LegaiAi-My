// components/matters/library/matter-library.tsx
"use client";

import * as React from "react";
import { LayoutGrid, List, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Matter, MatterSort, MatterSortKey, MatterViewMode } from "../types";
import { MatterGrid } from "./matter-grid";
import { MatterList } from "./matter-list";
import { MatterTable } from "./matter-table";
import { MatterEmpty } from "../status/matter-empty";
import { MatterLoading } from "../status/matter-loading";

export interface MatterLibraryProps {
  matters: Matter[];
  loading?: boolean;
  view?: MatterViewMode;
  onViewChange?: (view: MatterViewMode) => void;
  sort?: MatterSort;
  onSortChange?: (key: MatterSortKey) => void;
  onOpen?: (matter: Matter) => void;
  onFavoriteChange?: (matter: Matter, next: boolean) => void;
  onMenu?: (matter: Matter, anchor: HTMLElement) => void;
  emptyAction?: { label: string; onClick: () => void };
  emptySecondaryAction?: { label: string; onClick: () => void };
}

export function MatterLibrary({
  matters,
  loading,
  view = "grid",
  onViewChange,
  sort,
  onSortChange,
  onOpen,
  onFavoriteChange,
  onMenu,
  emptyAction,
  emptySecondaryAction,
}: MatterLibraryProps) {
  if (loading) return <MatterLoading variant={view === "table" ? "table" : view === "list" ? "list" : "grid"} />;

  if (!matters.length) {
    return <MatterEmpty primaryAction={emptyAction} secondaryAction={emptySecondaryAction} />;
  }

  return (
    <div className="space-y-3">
      {onViewChange ? (
        <div className="flex justify-end">
          <Tabs value={view} onValueChange={(v) => onViewChange(v as MatterViewMode)}>
            <TabsList>
              <TabsTrigger value="grid" aria-label="Grid view">
                <LayoutGrid className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="list" aria-label="List view">
                <List className="size-4" />
              </TabsTrigger>
              <TabsTrigger value="table" aria-label="Table view">
                <Table2 className="size-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}

      {view === "grid" || view === "kanban" ? (
        <MatterGrid matters={matters} onOpen={onOpen} onFavoriteChange={onFavoriteChange} onMenu={onMenu} />
      ) : view === "list" ? (
        <MatterList matters={matters} onOpen={onOpen} onMenu={onMenu} />
      ) : (
        <MatterTable matters={matters} sort={sort} onSortChange={onSortChange} onOpen={onOpen} />
      )}
    </div>
  );
}
