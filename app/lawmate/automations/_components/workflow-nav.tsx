"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, GitBranch, History, Settings2, Workflow } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = (id: string) => [
  { href: `/lawmate/automations/${id}/builder`, label: "Builder", icon: <Workflow className="size-3.5" /> },
  { href: `/lawmate/automations/${id}/runs`, label: "Runs", icon: <History className="size-3.5" /> },
  { href: `/lawmate/automations/${id}/versions`, label: "Versions", icon: <GitBranch className="size-3.5" /> },
  { href: `/lawmate/automations/${id}/analytics`, label: "Analytics", icon: <BarChart3 className="size-3.5" /> },
  { href: `/lawmate/automations/${id}/settings`, label: "Settings", icon: <Settings2 className="size-3.5" /> },
];

export function WorkflowScopedNav({ id }: { id: string }) {
  const pathname = usePathname();
  const tabs = TABS(id);
  return (
    <div className="border-b border-border/60 px-3">
      <Tabs value={tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0]?.href}>
        <TabsList className="h-auto gap-1 bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger key={t.href} value={t.href} asChild className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Link href={t.href}>{t.icon}<span className="ml-1.5">{t.label}</span></Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
