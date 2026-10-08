"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bot,
  FileText,
  Briefcase,
  Plus,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { QuickPromptSheet } from "@/components/lawmate/QuickPromptSheet";
import { LawMateMark } from "@/components/navigation/Logo";

export function MobileBottomNav() {
  const pathname = usePathname();
  const [askOpen, setAskOpen] = useState(false);

  const items = [
    { href: "/lawmate", label: "Home", icon: LawMateMark, matchPrefix: "/lawmate" },
    { href: "/lawmate/research", label: "Search", icon: Search, matchPrefix: "/lawmate/research" },
    { href: "/lawmate/documents", label: "Docs", icon: FileText, matchPrefix: "/lawmate/documents" },
    { href: "/lawmate/matters", label: "Matters", icon: Briefcase, matchPrefix: "/lawmate/matters" },
  ];

  const isActive = (href: string, prefix?: string) => {
    if (href === "/lawmate") return pathname === "/lawmate";
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
            const isHome = it.href === "/lawmate";
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
                {isHome ? (
                  <Icon size={active ? "md" : "sm"} className="shrink-0" aria-hidden="true" />
                ) : (
                  <Icon className="size-5" aria-hidden="true" />
                )}
                {it.label}
              </Link>
            );
          })}
          <button
            onClick={() => setAskOpen(true)}
            className="-mt-7 mx-auto flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-[hsl(var(--brand-blue))] to-[hsl(var(--brand-indigo))] text-primary-foreground shadow-lg shadow-[hsl(var(--brand-blue))/0.3]"
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
                <Icon className="size-5" aria-hidden="true" />
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