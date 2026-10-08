"use client";
import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { ContractActivityEvent } from "../types";

export function ContractActivityFeed({ events }: { events: ContractActivityEvent[] }) {
  if (!events.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ol className="space-y-4">
      {events.map((e) => {
        const initials = (e.actorName ?? "?").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
        return (
          <li key={e.id} className="flex gap-3">
            <Avatar className="size-8"><AvatarFallback>{initials}</AvatarFallback></Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm"><span className="font-medium">{e.actorName ?? "Someone"}</span> <span className="text-muted-foreground">{e.kind.replace("-", " ")}</span></p>
              {e.message ? <p className="truncate text-xs text-muted-foreground">{e.message}</p> : null}
              <p className="mt-0.5 text-[11px] text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
