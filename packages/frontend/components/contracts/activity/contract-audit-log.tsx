"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import type { ContractActivityEvent } from "../types";

export function ContractAuditLog({ events }: { events: ContractActivityEvent[] }) {
  return (
    <Card className="overflow-hidden">
      <table className="w-full text-xs">
        <thead className="border-b border-border/60 bg-muted/40 text-left text-muted-foreground">
          <tr><th className="p-2">Time</th><th className="p-2">Actor</th><th className="p-2">Event</th><th className="p-2">Message</th></tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id} className="border-b border-border/40 last:border-0">
              <td className="p-2 tabular-nums text-muted-foreground">{new Date(e.timestamp).toLocaleString()}</td>
              <td className="p-2">{e.actorName ?? "—"}</td>
              <td className="p-2 capitalize">{e.kind.replace("-", " ")}</td>
              <td className="p-2 text-muted-foreground">{e.message ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
