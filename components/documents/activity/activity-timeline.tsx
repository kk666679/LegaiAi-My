"use client";
import * as React from "react";
import type { DocumentActivityEvent } from "../types";
import { ActivityItem } from "./activity-item";

export function ActivityTimeline({ events }: { events: DocumentActivityEvent[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border/60 pl-4" aria-label="Timeline">
      {events.map((e) => (
        <li key={e.id} className="relative">
          <span className="absolute -left-[22px] top-1.5 size-2 rounded-full bg-primary" aria-hidden />
          <ActivityItem event={e} />
        </li>
      ))}
    </ol>
  );
}
