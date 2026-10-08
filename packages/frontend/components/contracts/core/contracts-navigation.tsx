"use client";
import * as React from "react";
import { BarChart3, BookOpen, Building2, Calendar, FileSignature, LayoutDashboard, ListChecks, ScrollText, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface ContractNavItem { id: string; label: string; icon?: React.ReactNode; count?: number; active?: boolean; onSelect?: () => void; }
export interface ContractsNavigationProps { items?: ContractNavItem[]; className?: string; }

const DEFAULT_ITEMS: ContractNavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { id: "all", label: "All contracts", icon: <FileSignature className="size-4" /> },
  { id: "drafts", label: "Drafts", icon: <ScrollText className="size-4" /> },
  { id: "negotiation", label: "In negotiation", icon: <Sparkles className="size-4" /> },
  { id: "approvals", label: "Approvals", icon: <ShieldAlert className="size-4" /> },
  { id: "obligations", label: "Obligations", icon: <ListChecks className="size-4" /> },
  { id: "renewals", label: "Renewals", icon: <Calendar className="size-4" /> },
  { id: "clauses", label: "Clause library", icon: <BookOpen className="size-4" /> },
  { id: "counterparties", label: "Counterparties", icon: <Building2 className="size-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="size-4" /> },
];

export function ContractsNavigation({ items = DEFAULT_ITEMS, className }: ContractsNavigationProps) {
  const [active, setActive] = React.useState(items.find((i) => i.active)?.id ?? "overview");
  return (
    <nav aria-label="Contracts" className={cn("flex h-full flex-col", className)}>
      <ScrollArea className="flex-1 px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((item) => {
            const isActive = item.active ?? item.id === active;
            return (
              <li key={item.id}>
                <Button type="button" variant={isActive ? "secondary" : "ghost"} size="sm"
                  className={cn("w-full justify-start gap-2", isActive && "font-medium")}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => { setActive(item.id); item.onSelect?.(); }}>
                  {item.icon}
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {typeof item.count === "number" ? <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">{item.count}</span> : null}
                </Button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </nav>
  );
}
