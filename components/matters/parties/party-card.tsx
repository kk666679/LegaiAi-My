// components/matters/parties/party-card.tsx
"use client";

import * as React from "react";
import { Building2, Mail, MapPin, Phone, User } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MatterParty } from "../types";

export interface PartyCardProps {
  party: MatterParty;
  onSelect?: (party: MatterParty) => void;
}

export function PartyCard({ party, onSelect }: PartyCardProps) {
  const Icon = party.kind === "company" || party.kind === "government" ? Building2 : User;
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(party)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSelect?.(party);
      }}
      className="cursor-pointer p-3 transition-colors hover:border-primary/40"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-muted p-2 text-muted-foreground">
          <Icon className="size-4" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium">{party.name}</p>
            {party.isPrimary ? (
              <Badge variant="secondary" className="text-[10px]">
                Primary
              </Badge>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs capitalize text-muted-foreground">
            {party.role.replace("-", " ")}
          </p>
          <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
            {party.email ? (
              <p className="flex items-center gap-1.5">
                <Mail className="size-3" /> {party.email}
              </p>
            ) : null}
            {party.phone ? (
              <p className="flex items-center gap-1.5">
                <Phone className="size-3" /> {party.phone}
              </p>
            ) : null}
            {party.address ? (
              <p className="flex items-center gap-1.5">
                <MapPin className="size-3" /> <span className="truncate">{party.address}</span>
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
}
