// components/matters/overview/upcoming-deadlines.tsx
"use client";

import * as React from "react";
import { CalendarClock } from "lucide-react";
import type { MatterDeadline } from "../types";

export interface UpcomingDeadlinesProps {
  deadlines: MatterDeadline[];
  onOpen?: (deadline: MatterDeadline) => void;
}

export function UpcomingDeadlines({ deadlines, onOpen }: UpcomingDeadlinesProps) {
  return (
    <section aria-labelledby="upcoming-deadlines-heading" className="space-y-2">
      <h2 id="upcoming-deadlines-heading" className="text-sm font-medium">
        Upcoming deadlines
      </h2>
      {deadlines.length === 0 ? (
        <p className="text-xs text-muted-foreground">No deadlines in the next 14 days.</p>
      ) : (
        <ul className="space-y-2">
          {deadlines.slice(0, 6).map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => onOpen?.(d)}
                className="flex w-full items-start gap-3 rounded-md border border-border/60 bg-card p-2.5 text-left transition-colors hover:border-primary/40"
              >
                <CalendarClock className="mt-0.5 size-4 shrink-0 text-amber-500" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(d.dueAt).toLocaleString()} · {d.kind}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
