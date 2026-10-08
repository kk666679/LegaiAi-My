"use client";
// app/lawmate/research/_components/session-scoped-nav.tsx
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = (id: string) => [
  { href: `/lawmate/research/${id}/results`, label: "Results" },
  { href: `/lawmate/research/${id}/reasoning`, label: "Reasoning" },
  { href: `/lawmate/research/${id}/citations`, label: "Citations" },
  { href: `/lawmate/research/${id}/timeline`, label: "Timeline" },
  { href: `/lawmate/research/${id}/memo`, label: "Memo" },
  { href: `/lawmate/research/${id}/overview`, label: "Overview" },
];

export function SessionScopedNav({ id }: { id: string }) {
  const pathname = usePathname();
  const tabs = TABS(id);
  const active = tabs.find((t) => pathname.startsWith(t.href))?.href ?? tabs[0]?.href ?? "";
  return (
    <div className="border-b border-border/60 px-3">
      <Tabs value={active}>
        <TabsList className="h-auto flex-wrap gap-1 bg-transparent p-0">
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
