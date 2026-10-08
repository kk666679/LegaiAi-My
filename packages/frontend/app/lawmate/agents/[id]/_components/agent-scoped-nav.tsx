"use client";
// app/lawmate/agents/[id]/_components/agent-scoped-nav.tsx
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = (id: string) => [
  { href: `/lawmate/agents/${id}/overview`, label: "Overview" },
  { href: `/lawmate/agents/${id}/runs`, label: "Runs" },
  { href: `/lawmate/agents/${id}/metrics`, label: "Metrics" },
  { href: `/lawmate/agents/${id}/logs`, label: "Logs" },
  { href: `/lawmate/agents/${id}/settings`, label: "Settings" },
];

export function AgentScopedNav({ id }: { id: string }) {
  const pathname = usePathname();
  const tabs = TABS(id);
  const active = tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0]?.href ?? "";
  return (
    <div className="border-b border-border/60 px-3">
      <Tabs value={active}>
        <TabsList className="h-auto gap-1 bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.href}
              value={t.href}
              asChild
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
            >
              <Link href={t.href}>{t.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
