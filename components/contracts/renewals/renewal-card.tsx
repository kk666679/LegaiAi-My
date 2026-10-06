"use client";
import * as React from "react";
import { AlarmClock, Calendar, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RenewalAlert } from "../types";

export function RenewalCard({ alert, onSelect }: { alert: RenewalAlert; onSelect?: (a: RenewalAlert) => void }) {
  const days = Math.ceil((new Date(alert.triggerAt).getTime() - Date.now()) / 86_400_000);
  const urgent = days <= 14;
  return (
    <Card role="button" tabIndex={0} onClick={() => onSelect?.(alert)} onKeyDown={(e) => { if (e.key === "Enter") onSelect?.(alert); }}
      className={cn("cursor-pointer p-3 transition-colors hover:border-primary/40", urgent && "border-destructive/40 bg-destructive/5")}>
      <div className="flex items-start gap-3">
        <div className={cn("rounded-md p-1.5", urgent ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}><AlarmClock className="size-3.5" /></div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{alert.contractName}</p>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Calendar className="size-3" />{new Date(alert.triggerAt).toLocaleDateString()}</span>
            <span className={cn(urgent && "font-medium text-destructive")}>{days > 0 ? `${days}d remaining` : "Past due"}</span>
            <span className="capitalize">{alert.type.replace("-", " ")}</span>
            {alert.noticeDays ? <span>{alert.noticeDays}d notice</span> : null}
          </div>
          {alert.ownerName ? <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground"><User className="size-3" />{alert.ownerName}</p> : null}
        </div>
      </div>
    </Card>
  );
}
