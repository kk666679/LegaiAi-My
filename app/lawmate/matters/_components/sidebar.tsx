"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive, BarChart3, Briefcase, CalendarClock, CheckCircle2,
  Clock, FileText, Heart, LayoutDashboard, PauseCircle, Plus, ShieldAlert, Star, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/legalai/matters", label: "Overview", icon: <LayoutDashboard className="size-4" />, exact: true },
  { href: "/legalai/matters/new", label: "New matter", icon: <Plus className="size-4" /> },
  { href: "/legalai/matters/recent", label: "Recent", icon: <Clock className="size-4" /> },
  { href: "/legalai/matters/favorites", label: "Favorites", icon: <Star className="size-4" /> },
  { href: "/legalai/matters?assignedTo=me", label: "My matters", icon: <Users className="size-4" /> },
  { href: "/legalai/matters?status=open", label: "Open", icon: <Briefcase className="size-4" /> },
  { href: "/legalai/matters?status=on_hold", label: "On hold", icon: <PauseCircle className="size-4" /> },
  { href: "/legalai/matters/closed", label: "Closed", icon: <CheckCircle2 className="size-4" /> },
  { href: "/legalai/matters?status=archived", label: "Archived", icon: <Archive className="size-4" /> },
  { href: "/legalai/matters/deadlines", label: "Deadlines", icon: <CalendarClock className="size-4" /> },
  { href: "/legalai/matters/conflicts", label: "Conflicts", icon: <ShieldAlert className="size-4" /> },
  { href: "/legalai/matters/analytics", label: "Analytics", icon: <BarChart3 className="size-4" /> },
];

export function MattersSidebar() {
  const pathname = usePathname();
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
        <div className="grid size-7 place-items-center rounded-md bg-primary/10 text-primary">
          <Briefcase className="size-4" />
        </div>
        <p className="text-sm font-semibold">Matters</p>
      </div>
      <ScrollArea className="flex-1 px-2 py-3">
        <nav aria-label="Matters">
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
