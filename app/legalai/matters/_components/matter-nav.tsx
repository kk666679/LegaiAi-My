"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = (id: string) => [
  { href: `/matters/${id}/overview`,   label: "Overview" },
  { href: `/matters/${id}/tasks`,      label: "Tasks" },
  { href: `/matters/${id}/deadlines`,  label: "Deadlines" },
  { href: `/matters/${id}/time`,       label: "Time" },
  { href: `/matters/${id}/billing`,    label: "Billing" },
  { href: `/matters/${id}/documents`,  label: "Documents" },
  { href: `/matters/${id}/parties`,    label: "Parties" },
  { href: `/matters/${id}/team`,       label: "Team" },
  { href: `/matters/${id}/notes`,      label: "Notes" },
  { href: `/matters/${id}/conflicts`,  label: "Conflicts" },
  { href: `/matters/${id}/permissions`, label: "Permissions" },
  { href: `/matters/${id}/ai`,         label: "AI" },
  { href: `/matters/${id}/activity`,   label: "Activity" },
  { href: `/matters/${id}/analytics`,  label: "Analytics" },
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
