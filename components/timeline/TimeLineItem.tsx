"use client";

import { Badge } from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { cn } from "@/lib/utils";

import {
  AREA_ICONS,
  AREA_LABELS,
  STATUS_STYLES,
} from "./constants";

import { TimelineEvent } from "./types";

type Props = {
  event: TimelineEvent;
};

export function TimelineItem({
  event,
}: Props) {
  const Icon =
    AREA_ICONS[event.area];

  return (
    <div className="relative pl-10">
      <div className="absolute left-4 top-0 h-full w-px bg-border" />

      <div className="absolute left-0 top-5 z-10 flex h-8 w-8 items-center justify-center rounded-full border bg-background shadow-sm">
        <Icon className="h-4 w-4" />
      </div>

      <Card className="transition-all hover:shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge variant="outline">
              {event.dateLabel}
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                "border",
                STATUS_STYLES[
                  event.status
                ]
              )}
            >
              {event.status}
            </Badge>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-xl leading-snug">
              {event.title}
            </CardTitle>

            <Badge variant="secondary">
              {
                AREA_LABELS[
                  event.area
                ]
              }
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <p className="text-sm leading-7 text-muted-foreground">
            {event.summary}
          </p>

          <div className="flex flex-wrap gap-2">
            {event.citationMarkers.map(
              (marker) => (
                <Badge
                  key={marker}
                  variant="outline"
                  className="text-xs"
                >
                  {marker}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}