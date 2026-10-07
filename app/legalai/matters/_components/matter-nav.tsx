"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = (id: string) => [
  { href: `/legalai/matters/${id}/overview`,   label: "Overview" },
  { href: `/legalai/matters/${id}/tasks`,      label: "Tasks" },
  { href: `/legalai/matters/${id}/deadlines`,  label: "Deadlines" },
  { href: `/legalai/matters/${id}/time`,       label: "Time" },
  { href: `/legalai/matters/${id}/billing`,    label: "Billing" },
  { href: `/legalai/matters/${id}/documents`,  label: "Documents" },
  { href: `/legalai/matters/${id}/parties`,    label: "Parties" },
  { href: `/legalai/matters/${id}/team`,       label: "Team" },
  { href: `/legalai/matters/${id}/notes`,      label: "Notes" },
  { href: `/legalai/matters/${id}/conflicts`,  label: "Conflicts" },
  { href: `/legalai/matters/${id}/permissions`, label: "Permissions" },
  { href: `/legalai/matters/${id}/ai`,         label: "AI" },
  { href: `/legalai/matters/${id}/activity`,   label: "Activity" },
  { href: `/legalai/matters/${id}/analytics`,  label: "Analytics" },
];

export function MatterScopedNav({ id }: { id: string }) {
  const pathname = usePathname();
  const tabs = TABS(id);
  const active = tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0]!.href;
  return (
    <div className="border-b border-border/60 px-3">
      <Tabs value={active}>
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
          {tabs.map((t) => (
            <TabsTrigger key={t.href} value={t.href} asChild className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Link href={t.href}>{t.label}</Link>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}
