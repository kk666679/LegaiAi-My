"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = (id: string) => [
  { href: `/legalai/documents/${id}/preview`,     label: "Preview" },
  { href: `/legalai/documents/${id}/analysis`,    label: "Analysis" },
  { href: `/legalai/documents/${id}/versions`,    label: "Versions" },
  { href: `/legalai/documents/${id}/comparison`,  label: "Comparison" },
  { href: `/legalai/documents/${id}/comments`,    label: "Comments" },
  { href: `/legalai/documents/${id}/activity`,    label: "Activity" },
  { href: `/legalai/documents/${id}/permissions`, label: "Permissions" },
  { href: `/legalai/documents/${id}/studio`,      label: "Studio" },
];

export function DocumentScopedNav({ id }: { id: string }) {
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
