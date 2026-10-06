"use client";
// app/legalai/agents/_components/audit-page.tsx
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "./use-agents";

export function AuditPage() {
  const { audit } = useAgents({ scope: "all" });
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Audit trail</h1>
        <p className="text-xs text-muted-foreground">Every agent action, capability change, and budget adjustment.</p>
      </header>
      <div className="space-y-2 p-4">
        {audit.length === 0 ? (
          <p className="text-sm text-muted-foreground">No audit events.</p>
        ) : (
          audit.map((e) => (
            <Card key={e.id} className="p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="text-[10px] capitalize">{e.kind}</Badge>
                <span className="text-sm font-medium">{e.agentName}</span>
                <span className="text-[11px] text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</span>
              </div>
              {e.message ? <p className="mt-1 text-sm">{e.message}</p> : null}
              {e.actorName ? <p className="mt-0.5 text-[11px] text-muted-foreground">by {e.actorName}</p> : null}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
