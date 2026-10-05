// components/matters/team/team-member-card.tsx
"use client";

import * as React from "react";
import { Crown, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { MatterTeamMember } from "../types";

export interface TeamMemberCardProps {
  member: MatterTeamMember;
  onRemove?: (member: MatterTeamMember) => void;
}

export function TeamMemberCard({ member, onRemove }: TeamMemberCardProps) {
  const initials = member.name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div className="flex items-center gap-3 rounded-md border border-border/60 p-2.5">
      <Avatar className="size-9">
        {member.avatarUrl ? <AvatarImage src={member.avatarUrl} alt="" /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-sm font-medium">{member.name}</p>
          {member.isLead ? (
            <Badge variant="secondary" className="gap-1 text-[10px]">
              <Crown className="size-2.5" /> Lead
            </Badge>
          ) : null}
        </div>
        <p className="truncate text-xs capitalize text-muted-foreground">
          {member.role}
          {member.email ? ` · ${member.email}` : ""}
        </p>
      </div>
      {onRemove && !member.isLead ? (
        <Button
          size="icon"
          variant="ghost"
          className="size-7 text-muted-foreground"
          aria-label={`Remove ${member.name}`}
          onClick={() => onRemove(member)}
        >
          <Trash2 className="size-3.5" />
        </Button>
      ) : null}
    </div>
  );
}
