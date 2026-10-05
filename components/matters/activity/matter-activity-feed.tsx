// components/matters/activity/matter-activity-feed.tsx
"use client";

import * as React from "react";
import type { MatterActivityEvent } from "../types";
import { ActivityItem } from "./activity-item";

export interface MatterActivityFeedProps {
  events: MatterActivityEvent[];
}

export function MatterActivityFeed({ events }: MatterActivityFeedProps) {
  if (!events.length) return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  return (
    <ol className="space-y-4" aria-label="Matter activity">
      {events.map((e) => (
        <ActivityItem key={e.id} event={e} />
      ))}
    </ol>
  );
}
