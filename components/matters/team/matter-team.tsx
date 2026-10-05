// components/matters/team/matter-team.tsx
"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MatterTeamMember } from "../types";
import { TeamMemberCard } from "./team-member-card";

export interface MatterTeamProps {
  members: MatterTeamMember[];
  onAdd?: () => void;
  onRemove?: (member: MatterTeamMember) => void;
}

export function MatterTeam({ members, onAdd, onRemove }: MatterTeamProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{members.length} team members</p>
        {onAdd ? (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={onAdd}>
            <UserPlus className="size-3.5" /> Add member
          </Button>
        ) : null}
      </div>
      {members.length === 0 ? (
        <p className="text-sm text-muted-foreground">No team members assigned yet.</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {members.map((m) => (
            <TeamMemberCard key={m.id} member={m} onRemove={onRemove} />
          ))}
        </div>
      )}
    </div>
  );
}
