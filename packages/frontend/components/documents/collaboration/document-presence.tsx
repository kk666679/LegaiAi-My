"use client";
import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface PresenceUser { id: string; name: string; avatarUrl?: string; }
export function DocumentPresence({ users }: { users: PresenceUser[] }) {
  if (!users.length) return null;
  return (
    <div className="flex -space-x-1.5">
      {users.slice(0, 5).map((u) => (
        <Avatar key={u.id} className="size-6 border-2 border-background">
          {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
          <AvatarFallback className="text-[9px]">{u.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase()}</AvatarFallback>
        </Avatar>
      ))}
      {users.length > 5 ? <span className="flex size-6 items-center justify-center rounded-full border-2 border-background bg-muted text-[9px] text-muted-foreground">+{users.length - 5}</span> : null}
    </div>
  );
}
