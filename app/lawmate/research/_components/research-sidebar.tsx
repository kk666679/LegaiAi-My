"use client";
// app/lawmate/research/_components/research-sidebar.tsx
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bookmark,
  Clock,
  FolderOpen,
  GitCompare,
  History,
  LayoutDashboard,
  Search,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  exact?: boolean;
  count?: number;
}

const GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Research",
    items: [
      { href: "/lawmate/research", label: "Overview", icon: <LayoutDashboard className="size-4" />, exact: true },
      { href: "/lawmate/research/new", label: "New research", icon: <Sparkles className="size-4" /> },
      { href: "/lawmate/research/history", label: "History", icon: <History className="size-4" /> },
      { href: "/lawmate/research/saved", label: "Saved", icon: <Bookmark className="size-4" /> },
    ],
  },
  {
    title: "Organize",
    items: [
      { href: "/lawmate/research/collections", label: "Collections", icon: <FolderOpen className="size-4" /> },
      { href: "/lawmate/research/compare", label: "Compare", icon: <GitCompare className="size-4" /> },
      { href: "/lawmate/research/analytics", label: "Analytics", icon: <BarChart3 className="size-4" /> },
    ],
  },
];

export function ResearchSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Research" className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
          <Search className="size-4" />
        </div>
        <p className="text-sm font-semibold">Research</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        {GROUPS.map((group) => (
          <section key={group.title} className="mb-4">
            <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Button
                      asChild
                      variant={active ? "secondary" : "ghost"}
                      size="sm"
                      className={cn("w-full justify-start gap-2", active && "font-medium")}
                    >
                      <Link href={item.href}>
                        {item.icon}
                        <span className="flex-1 truncate text-left">{item.label}</span>
                        {typeof item.count === "number" ? (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {item.count}
                          </span>
                        ) : null}
                      </Link>
                    </Button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </ScrollArea>
      <div className="border-t border-border/60 p-3">
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <Clock className="size-3" />
          <span>Sources refreshed 3 min ago</span>
        </div>
      </div>
    </nav>
  );
}
