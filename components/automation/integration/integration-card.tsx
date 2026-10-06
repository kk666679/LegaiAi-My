"use client";
import * as React from "react";
import { Check, Plus, Settings2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Integration {
  id: string;
  name: string;
  description?: string;
  category: "legal" | "communication" | "storage" | "productivity" | "custom";
  connected: boolean;
  logoUrl?: string;
}

export interface IntegrationCardProps { integration: Integration; onConnect?: (i: Integration) => void; onDisconnect?: (i: Integration) => void; onConfigure?: (i: Integration) => void; }

export function IntegrationCard({ integration, onConnect, onDisconnect, onConfigure }: IntegrationCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3 p-4", integration.connected && "border-emerald-500/40")}>
      <div className="flex items-start gap-3">
        {integration.logoUrl ? (
          <img src={integration.logoUrl} alt="" className="size-8 rounded-md" />
        ) : (
          <div className="grid size-8 place-items-center rounded-md bg-muted text-muted-foreground">{integration.name[0]}</div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-medium">{integration.name}</p>
            {integration.connected ? <Badge variant="outline" className="gap-1 border-transparent bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400"><Check className="size-2.5" />Connected</Badge> : null}
          </div>
          {integration.description ? <p className="line-clamp-2 text-xs text-muted-foreground">{integration.description}</p> : null}
        </div>
      </div>
      <div className="mt-auto flex gap-2">
        {integration.connected ? (
          <>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onConfigure?.(integration)}><Settings2 className="size-3.5" />Configure</Button>
            <Button size="sm" variant="ghost" onClick={() => onDisconnect?.(integration)}>Disconnect</Button>
          </>
        ) : (
          <Button size="sm" variant="outline" className="gap-1.5" onClick={() => onConnect?.(integration)}><Plus className="size-3.5" />Connect</Button>
        )}
      </div>
    </Card>
  );
}
