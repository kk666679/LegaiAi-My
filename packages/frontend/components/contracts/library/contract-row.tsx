"use client";
import * as React from "react";
import { AlertTriangle, FileSignature, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Contract } from "../types";
import { ContractStatusIndicator } from "../status/contract-status-indicator";

export function ContractRow({ contract, onOpen, onMenu, className }: { contract: Contract; onOpen?: (c: Contract) => void; onMenu?: (c: Contract, anchor: HTMLElement) => void; className?: string }) {
  const menuRef = React.useRef<HTMLButtonElement>(null);
  return (
    <div role="button" tabIndex={0} onClick={() => onOpen?.(contract)} onKeyDown={(e) => { if (e.key === "Enter") onOpen?.(contract); }}
      className={cn("group flex items-center gap-3 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors hover:border-primary/40", className)}>
      <div className="rounded bg-muted p-2 text-muted-foreground"><FileSignature className="size-4" /></div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{contract.name}</p>
        <p className="truncate text-xs text-muted-foreground">{contract.counterpartyName ?? "—"} · {contract.type.replace("-", " ")}</p>
      </div>
      {contract.criticalRiskCount ? <AlertTriangle className="size-4 text-destructive" aria-label="Critical risks" /> : null}
      <ContractStatusIndicator status={contract.status} compact />
      <span className="hidden w-24 truncate text-xs text-muted-foreground sm:block">{new Date(contract.updatedAt).toLocaleDateString()}</span>
      {onMenu ? (
        <Button ref={menuRef} size="icon" variant="ghost" className="size-7 opacity-0 group-hover:opacity-100" aria-label="Actions"
          onClick={(e) => { e.stopPropagation(); if (menuRef.current) onMenu(contract, menuRef.current); }}>
          <MoreHorizontal className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
