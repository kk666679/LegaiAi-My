"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, BookOpen, Building2, Calendar, FileSignature, FileText, LayoutDashboard, PenLine, ScrollText, ShieldAlert, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/lawmate/contracts", label: "Overview", icon: <LayoutDashboard className="size-4" />, exact: true },
  { href: "/lawmate/contracts/new", label: "New contract", icon: <PenLine className="size-4" /> },
  { href: "/lawmate/contracts?status=review", label: "In review", icon: <ShieldAlert className="size-4" /> },
  { href: "/lawmate/contracts?status=executed", label: "Executed", icon: <Building2 className="size-4" /> },
  { href: "/lawmate/contracts?status=draft", label: "Drafts", icon: <FileText className="size-4" /> },
  { href: "/lawmate/contracts/counterparties", label: "Counterparties", icon: <Users className="size-4" /> },
  { href: "/lawmate/contracts/renewals", label: "Renewals", icon: <Calendar className="size-4" /> },
  { href: "/lawmate/contracts/playbooks", label: "Playbooks", icon: <ScrollText className="size-4" /> },
  { href: "/lawmate/contracts/templates", label: "Templates", icon: <BookOpen className="size-4" /> },
  { href: "/lawmate/contracts/clauses", label: "Clause Library", icon: <FileText className="size-4" /> },
  { href: "/lawmate/contracts/approvals", label: "Approvals", icon: <ShieldAlert className="size-4" /> },
  { href: "/lawmate/contracts/analytics", label: "Analytics", icon: <BarChart3 className="size-4" /> },
];

export function ContractsSidebar() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary"><FileSignature className="size-4" /></div>
        <p className="text-sm font-semibold">Contracts</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav aria-label="Contracts">
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
