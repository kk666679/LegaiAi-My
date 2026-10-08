// components/matters/activity/activity-item.tsx
"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { MatterActivityEvent } from "../types";

export interface ActivityItemProps {
  event: MatterActivityEvent;
  avatarUrl?: string;
}

export function ActivityItem({ event, avatarUrl }: ActivityItemProps) {
  const initials = (event.actorName ?? "?")
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <li className="flex gap-3">
      <Avatar className="size-8">
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-medium">{event.actorName ?? "Someone"}</span>{" "}
          <span className="text-muted-foreground">{event.kind.replace("-", " ")}</span>
        </p>
        {event.message ? (
          <p className="truncate text-xs text-muted-foreground">{event.message}</p>
        ) : null}
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          {new Date(event.timestamp).toLocaleString()}
        </p>
      </div>
    </li>
  );
}
