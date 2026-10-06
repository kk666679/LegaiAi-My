// components/hitl/core/hitl-navigation.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  History,
  Inbox,
  LayoutDashboard,
  Settings2,
  UserCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export interface HITLNavItem {
  href: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  exact?: boolean;
}

const DEFAULT_ITEMS: HITLNavItem[] = [
  { href: "/legalai/hitl",             label: "Overview",     icon: <LayoutDashboard className="size-4" />, exact: true },
  { href: "/legalai/hitl/inbox",       label: "Inbox",        icon: <Inbox className="size-4" /> },
  { href: "/legalai/hitl/assigned",    label: "Assignment (unavailable)", icon: <UserCheck className="size-4" /> },
  { href: "/legalai/hitl/team",        label: "Team (unavailable)", icon: <Users className="size-4" /> },
  { href: "/legalai/hitl/escalations", label: "Escalations (unavailable)", icon: <AlertTriangle className="size-4" /> },
  { href: "/legalai/hitl/history",     label: "History",      icon: <History className="size-4" /> },
  { href: "/legalai/hitl/rules",       label: "Routing rules", icon: <Settings2 className="size-4" /> },
  { href: "/legalai/hitl/analytics",   label: "Analytics",    icon: <BarChart3 className="size-4" /> },
];

export interface HITLNavigationProps {
  items?: HITLNavItem[];
  className?: string;
}

export function HITLNavigation({ items = DEFAULT_ITEMS, className }: HITLNavigationProps) {
  const pathname = usePathname();
  return (
    <nav aria-label="HITL" className={cn("flex h-full flex-col", className)}>
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
          <CheckCircle2 className="size-4" />
        </div>
        <p className="text-sm font-semibold">Review queue</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <ul className="space-y-0.5">
          {items.map((l) => {
            const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
            return (
              <li key={l.href}>
                <Button
                  asChild
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("w-full justify-start gap-2", active && "font-medium")}
                >
                  <Link href={l.href}>
                    {l.icon}
                    <span className="flex-1 truncate text-left">{l.label}</span>
                    {typeof l.count === "number" ? (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                        {l.count}
                      </span>
                    ) : null}
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </nav>
  );
}