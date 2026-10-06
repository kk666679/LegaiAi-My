"use client";
// app/legalai/research/_components/session-scoped-nav.tsx
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = (id: string) => [
  { href: `/legalai/research/${id}/results`, label: "Results" },
  { href: `/legalai/research/${id}/reasoning`, label: "Reasoning" },
  { href: `/legalai/research/${id}/citations`, label: "Citations" },
  { href: `/legalai/research/${id}/timeline`, label: "Timeline" },
  { href: `/legalai/research/${id}/memo`, label: "Memo" },
  { href: `/legalai/research/${id}/overview`, label: "Overview" },
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
