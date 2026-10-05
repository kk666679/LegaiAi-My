"use client";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import { TimelineItem } from "./TimeLineItem";

import { TimelineEvent } from "./types";

type Props = {
  events: TimelineEvent[];
};

export function TimelineList({
  events,
}: Props) {
  if (!events.length) {
    return (
      <Card>
        <CardContent className="flex min-h-[240px] items-center justify-center">
          <div className="text-center">
            <p className="font-medium">
              No matching developments
            </p>

            <p className="text-sm text-muted-foreground">
              Try adjusting the filters.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {events.map((event) => (
        <TimelineItem
          key={event.id}
          event={event}
        />
      ))}
    </div>
  );
}