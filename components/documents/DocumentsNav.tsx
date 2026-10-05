"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutGrid } from "lucide-react";
import { NAVIGATION_GROUPS, type NavChild } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

/**
 * Contextual navigation for the Documents section (§2).
 *
 * This is a *contextual* strip, not a second application shell: the global
 * sidebar / top bar / breadcrumbs from `DashboardShell` are untouched, and
 * the route list is read from the single source of truth
 * (`NAVIGATION_GROUPS` → "Documents" group) so the two can never drift.
 *
 * Desktop  → inline pill tabs.
 * Mobile   → a Sheet trigger, so navigation never permanently occupies
 *            screen width and the app never scrolls horizontally.
 */

const DOCUMENTS_GROUP_LABEL = "Documents";

/** Reads the Documents routes out of the canonical navigation config. */
export function getDocumentsNavItems(): NavChild[] {
  return (
    NAVIGATION_GROUPS.find((g) => g.label === DOCUMENTS_GROUP_LABEL)?.items ?? []
  );
}

/** True when `href` is the section (or a child route of the section). */
function isItemActive(pathname: string, item: NavChild): boolean {
  const prefix = item.matchPrefix ?? item.href;
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function DocumentsNav({
  className,
  /** Hide the section label when the page already renders a full PageHeader. */
  showLabel = true,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const pathname = usePathname();
  const items = getDocumentsNavItems();

  if (items.length === 0) return null;

  const active = items.find((item) => isItemActive(pathname, item));

  return (
    <nav
      aria-label="Documents"
      data-slot="documents-nav"
      className={cn(
        "flex items-center gap-2 border-b bg-background/60",
        className,
      )}
    >
      {showLabel && (
        <span className="hidden shrink-0 pl-4 text-sm font-semibold sm:block">
          Documents
        </span>
      )}

      {/* Desktop / tablet: inline tabs */}
      <ul className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto px-2 py-1.5 md:flex">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = isItemActive(pathname, item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      {/* Mobile: Sheet, so nav does not consume the viewport */}
      <div className="flex w-full items-center px-3 py-1.5 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-between gap-2 font-normal"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <LayoutGrid className="size-4 shrink-0" aria-hidden />
                <span className="truncate">
                  {active?.label ?? "Documents"}
                </span>
              </span>
              <ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="w-72 max-w-[85vw] p-0"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetTitle className="sr-only">Documents</SheetTitle>
            <ul className="flex flex-col gap-1 p-3">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = isItemActive(pathname, item);
                return (
                  <li key={item.href}>
                    <SheetClose asChild>
                      <Link
                        href={item.href}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                          isActive
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="min-w-0 flex-1 truncate">
                          {item.label}
                        </span>
                      </Link>
                    </SheetClose>
                  </li>
                );
              })}
            </ul>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}