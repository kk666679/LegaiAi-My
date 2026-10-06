"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BookTemplate, Boxes, Plug, Plus, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/legalai/automations", label: "All workflows", icon: <Workflow className="size-4" />, exact: true },
  { href: "/legalai/automations/new", label: "New workflow", icon: <Plus className="size-4" /> },
  { href: "/legalai/automations/templates", label: "Templates", icon: <BookTemplate className="size-4" /> },
  { href: "/legalai/automations/runs", label: "Runs", icon: <Activity className="size-4" /> },
  { href: "/legalai/automations/integrations", label: "Integrations", icon: <Plug className="size-4" /> },
];

export function AutomationsSidebar() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary"><Boxes className="size-4" /></div>
        <p className="text-sm font-semibold">Automations</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav aria-label="Automations">
          <ul className="space-y-0.5">
            {LINKS.map((l) => {
              const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
              return (
                <li key={l.href}>
                  <Button asChild variant={active ? "secondary" : "ghost"} size="sm" className={cn("w-full justify-start gap-2", active && "font-medium")}>
                    <Link href={l.href}>{l.icon}{l.label}</Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollArea>
    </div>
  );
}