"use client";
import * as React from "react";
import { AlertTriangle, Building2, FileSignature, MoreHorizontal, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Contract } from "../types";
import { ContractStatusIndicator } from "../status/contract-status-indicator";

export interface ContractCardProps {
  contract: Contract;
  onOpen?: (c: Contract) => void;
  onFavoriteChange?: (c: Contract, next: boolean) => void;
  onMenu?: (c: Contract, anchor: HTMLElement) => void;
  className?: string;
}

export function ContractCard({ contract, onOpen, onFavoriteChange, onMenu, className }: ContractCardProps) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  return (
    <Card role="button" tabIndex={0} onClick={() => onOpen?.(contract)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen?.(contract); } }}
      className={cn("group relative flex cursor-pointer flex-col gap-3 p-4 transition-colors hover:border-primary/40", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="rounded-md bg-muted p-2 text-muted-foreground"><FileSignature className="size-4" /></div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{contract.name}</p>
            <p className="truncate text-xs text-muted-foreground">{contract.counterpartyName ?? "—"}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onFavoriteChange ? (
            <Button size="icon" variant="ghost" className="size-7 text-muted-foreground" aria-pressed={Boolean(contract.favourite)} aria-label="Favorite"
              onClick={(e) => { e.stopPropagation(); onFavoriteChange(contract, !contract.favourite); }}>
              <Star className={cn("size-4", contract.favourite && "fill-amber-400 text-amber-400")} />
            </Button>
          ) : null}
          {onMenu ? (
            <Button ref={menuRef} size="icon" variant="ghost" className="size-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100" aria-label="Actions"
              onClick={(e) => { e.stopPropagation(); if (menuRef.current) onMenu(contract, menuRef.current); }}>
              <MoreHorizontal className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ContractStatusIndicator status={contract.status} compact />
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] capitalize text-muted-foreground">{contract.type.replace("-", " ")}</span>
        {contract.criticalRiskCount ? <span className="inline-flex items-center gap-1 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] text-destructive"><AlertTriangle className="size-2.5" />{contract.criticalRiskCount}</span> : null}
        {contract.deviationCount ? <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 dark:text-amber-400">{contract.deviationCount} deviations</span> : null}
      </div>

      <div className="mt-auto grid grid-cols-2 gap-2 border-t border-border/60 pt-3 text-[11px]">
        {contract.value ? (
          <div><p className="text-muted-foreground">Value</p><p className="font-medium tabular-nums">{contract.currency ?? "RM"} {contract.value.toLocaleString()}</p></div>
        ) : null}
        {contract.expiresAt ? (
          <div><p className="text-muted-foreground">Expires</p><p className="font-medium">{new Date(contract.expiresAt).toLocaleDateString()}</p></div>
        ) : null}
      </div>
    </Card>
  );
}
