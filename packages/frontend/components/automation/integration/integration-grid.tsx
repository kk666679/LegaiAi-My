"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Integration } from "./integration-card";
import { IntegrationCard } from "./integration-card";

const CATEGORIES = ["all", "legal", "communication", "storage", "productivity", "custom", "payments"] as const;

export interface IntegrationGridProps { integrations: Integration[]; onConnect?: (i: Integration) => void; onDisconnect?: (i: Integration) => void; onConfigure?: (i: Integration) => void; }

export function IntegrationGrid({ integrations, onConnect, onDisconnect, onConfigure }: IntegrationGridProps) {
  const [cat, setCat] = React.useState<typeof CATEGORIES[number]>("all");
  const [q, setQ] = React.useState("");
  const filtered = integrations.filter((i) => (cat === "all" || i.category === cat) && (!q || i.name.toLowerCase().includes(q.toLowerCase())));
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search integrations" className="h-8 w-56 text-sm" aria-label="Search integrations" />
        <Tabs value={cat} onValueChange={(v) => setCat(v as typeof cat)}>
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {CATEGORIES.map((c) => <TabsTrigger key={c} value={c} className="rounded-full border border-border/60 capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">{c}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>
      {filtered.length === 0 ? <p className="p-4 text-xs text-muted-foreground">No integrations match.</p> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => <IntegrationCard key={i.id} integration={i} onConnect={onConnect} onDisconnect={onDisconnect} onConfigure={onConfigure} />)}
        </div>
      )}
    </div>
  );
}
