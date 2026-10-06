"use client";
import * as React from "react";
import { LayoutGrid, List, Table2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Contract, ContractSort, ContractSortKey, ContractViewMode } from "../types";
import { ContractGrid } from "./contract-grid";
import { ContractList } from "./contract-list";
import { ContractTable } from "./contract-table";
import { ContractEmpty } from "../status/contract-empty";
import { ContractLoading } from "../status/contract-loading";

export interface ContractLibraryProps {
  contracts: Contract[];
  loading?: boolean;
  view?: ContractViewMode;
  onViewChange?: (v: ContractViewMode) => void;
  sort?: ContractSort;
  onSortChange?: (k: ContractSortKey) => void;
  onOpen?: (c: Contract) => void;
  onFavoriteChange?: (c: Contract, next: boolean) => void;
  onMenu?: (c: Contract, anchor: HTMLElement) => void;
  emptyAction?: { label: string; onClick: () => void };
  emptySecondaryAction?: { label: string; onClick: () => void };
}

export function ContractLibrary({ contracts, loading, view = "grid", onViewChange, sort, onSortChange, onOpen, onFavoriteChange, onMenu, emptyAction, emptySecondaryAction }: ContractLibraryProps) {
  if (loading) return <ContractLoading variant={view === "table" ? "table" : view === "kanban" ? "grid" : view} />;
  if (!contracts.length) return <ContractEmpty primaryAction={emptyAction} secondaryAction={emptySecondaryAction} />;
  return (
    <div className="space-y-3">
      {onViewChange ? (
        <div className="flex justify-end">
          <Tabs value={view} onValueChange={(v) => onViewChange(v as ContractViewMode)}>
            <TabsList>
              <TabsTrigger value="grid" aria-label="Grid"><LayoutGrid className="size-4" /></TabsTrigger>
              <TabsTrigger value="list" aria-label="List"><List className="size-4" /></TabsTrigger>
              <TabsTrigger value="table" aria-label="Table"><Table2 className="size-4" /></TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      ) : null}
      {view === "grid" ? <ContractGrid contracts={contracts} onOpen={onOpen} onFavoriteChange={onFavoriteChange} onMenu={onMenu} /> :
       view === "list" ? <ContractList contracts={contracts} onOpen={onOpen} onMenu={onMenu} /> :
       <ContractTable contracts={contracts} sort={sort} onSortChange={onSortChange} onOpen={onOpen} />}
    </div>
  );
}
