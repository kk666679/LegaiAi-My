"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/navigation/Logo";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, ChevronDown, ChevronRight } from "lucide-react";
import { NAVIGATION_GROUPS, isItemActive } from "@/lib/navigation";

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  return (
    <div className="flex flex-col gap-1 px-2">
      {NAVIGATION_GROUPS.map((group) => (
        <div key={group.label} className="mb-1">
          <button
            onClick={() => toggle(group.label)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {group.label}
            {collapsed[group.label] ? (
              <ChevronRight className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>

          {!collapsed[group.label] && (
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isItemActive(pathname, item);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Flat list of top-level items for desktop quick nav
  const topItems = NAVIGATION_GROUPS.flatMap((g) => g.items).filter((i) =>
    [
      "/legalai",
      "/legalai/assistant",
      "/legalai/matters",
      "/legalai/documents",
      "/legalai/contracts",
      "/legalai/research",
      "/legalai/agents",
      "/legalai/hitl",
    ].includes(i.href)
  );

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="content-width safe-x">
        <div className="flex min-w-0 h-14 items-center justify-between gap-3">
          <Link href="/legalai" className="flex items-center">
            <Logo size="sm" />
          </Link>

          {/* Desktop quick nav */}
          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto lg:flex">
            {topItems.map((item) => {
              const active = isItemActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all",
                    active
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(20rem,calc(100vw-1rem))] p-0 overflow-y-auto safe-x">
              <div className="flex items-center gap-2 p-4 border-b">
                <Logo size="sm" />
              </div>
              <div className="py-4">
                <NavItems onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
