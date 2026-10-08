// components/documents/overview/document-activity.tsx
"use client";

import * as React from "react";
import type { DocumentActivityEvent } from "../types";

export interface DocumentActivityOverviewProps {
  events: DocumentActivityEvent[];
}

export function DocumentActivityOverview({ events }: DocumentActivityOverviewProps) {
  return (
    <section aria-labelledby="activity-heading" className="space-y-2">
      <h2 id="activity-heading" className="text-sm font-medium">
        Recent activity
      </h2>
      <ul className="space-y-2">
        {events.slice(0, 6).map((e) => (
          <li key={e.id} className="rounded-md border border-border/60 p-2.5 text-sm">
            <p className="font-medium">
              {e.actorName ?? "Someone"} · {e.kind}
            </p>
            {e.message ? (
              <p className="text-xs text-muted-foreground">{e.message}</p>
            ) : null}
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {new Date(e.timestamp).toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
