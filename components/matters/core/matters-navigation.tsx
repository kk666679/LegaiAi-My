// components/matters/core/matters-navigation.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Briefcase,
  Clock,
  Star,
  Users,
  CalendarClock,
  ListChecks,
  Receipt,
  AlertTriangle,
  Archive,
  LayoutDashboard,
} from "lucide-react";

export interface MatterNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  active?: boolean;
  onSelect?: () => void;
}

export interface MattersNavigationProps {
  items?: MatterNavItem[];
  className?: string;
}

const DEFAULT_ITEMS: MatterNavItem[] = [
  { id: "overview", label: "Overview", icon: <LayoutDashboard className="size-4" /> },
  { id: "all", label: "All Matters", icon: <Briefcase className="size-4" /> },
  { id: "mine", label: "My Matters", icon: <Users className="size-4" /> },
  { id: "recent", label: "Recent", icon: <Clock className="size-4" /> },
  { id: "favorites", label: "Favorites", icon: <Star className="size-4" /> },
  { id: "tasks", label: "Tasks", icon: <ListChecks className="size-4" /> },
  { id: "deadlines", label: "Deadlines", icon: <CalendarClock className="size-4" /> },
  { id: "billing", label: "Billing", icon: <Receipt className="size-4" /> },
  { id: "conflicts", label: "Conflicts", icon: <AlertTriangle className="size-4" /> },
  { id: "archived", label: "Archived", icon: <Archive className="size-4" /> },
];

export function MattersNavigation({ items = DEFAULT_ITEMS, className }: MattersNavigationProps) {
  const [active, setActive] = React.useState(items.find((i) => i.active)?.id ?? "overview");

  return (
    <nav aria-label="Matters" className={cn("flex h-full flex-col", className)}>
      <ScrollArea className="flex-1 px-2 py-3">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = item.active ?? item.id === active;
            return (
              <li key={item.id}>
                <Button
                  type="button"
                  variant={isActive ? "secondary" : "ghost"}
                  size="sm"
                  className={cn("w-full justify-start gap-2", isActive && "font-medium")}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setActive(item.id);
                    item.onSelect?.();
                  }}
                >
                  {item.icon}
                  <span className="flex-1 truncate text-left">{item.label}</span>
                  {typeof item.count === "number" ? (
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      {item.count}
                    </span>
                  ) : null}
                </Button>
              </li>
            );
          })}
        </ul>
      </ScrollArea>
    </nav>
  );
}
