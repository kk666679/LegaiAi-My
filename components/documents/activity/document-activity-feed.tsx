// components/documents/activity/document-activity-feed.tsx
"use client";

import * as React from "react";
import type { DocumentActivityEvent } from "../types";
import { ActivityItem } from "./activity-item";

export interface DocumentActivityFeedProps {
  events: DocumentActivityEvent[];
}

export function DocumentActivityFeed({ events }: DocumentActivityFeedProps) {
  if (!events.length) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }
  return (
    <ol className="space-y-4" aria-label="Document activity">
      {events.map((e) => (
        <ActivityItem key={e.id} event={e} />
      ))}
    </ol>
  );
}
