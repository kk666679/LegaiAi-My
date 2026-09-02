"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  FileText,
  Briefcase,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { QuickPromptSheet } from "@/components/lawmate/QuickPromptSheet";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [askOpen, setAskOpen] = useState(false);

  const items = [
    { href: "/legalai", label: "Home", icon: LayoutDashboard, matchPrefix: "/legalai" },
    { href: "/legalai/research", label: "Search", icon: Search, matchPrefix: "/legalai/research" },
    { href: "/legalai/documents", label: "Docs", icon: FileText, matchPrefix: "/legalai/documents" },
    { href: "/legalai/matters", label: "Matters", icon: Briefcase, matchPrefix: "/legalai/matters" },
  ];

  const isActive = (href: string, prefix?: string) => {
    if (href === "/legalai") return pathname === "/legalai";
    if (prefix) return pathname.startsWith(prefix);
    return pathname === href;
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden"
      >
        <div className="grid grid-cols-5 items-center px-2 pb-[env(safe-area-inset-bottom)] pt-1">
          {items.slice(0, 2).map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href, it.matchPrefix);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" />
                {it.label}
              </Link>
            );
          })}
          <button
            onClick={() => setAskOpen(true)}
            className="-mt-7 mx-auto flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30"
            aria-label="Ask LawMate"
          >
            <Plus className="size-6" />
          </button>
          {items.slice(2).map((it) => {
            const Icon = it.icon;
            const active = isActive(it.href, it.matchPrefix);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" />
                {it.label}
              </Link>
            );
          })}
        </div>
      </nav>
      <QuickPromptSheet open={askOpen} onOpenChange={setAskOpen} />
    </>
  );
}