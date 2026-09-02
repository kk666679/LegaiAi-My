"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  ChevronLeft,
  ChevronDown,
  PanelLeftClose,
  PanelLeftOpen,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { BRAND } from "@/lib/brand";
import { NAVIGATION_GROUPS, isItemActive, type NavGroup } from "@/lib/navigation";
import { useTranslation } from "@/lib/i18n/I18nProvider";

const STORAGE_KEY = "lawmate:sidebar:collapsed";
const GROUP_STORAGE_KEY = "lawmate:sidebar:groups";
const SIDEBAR_ID = "lawmate-sidebar";

export interface SidebarProps {
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  onNavigate?: () => void;
  variant?: "desktop" | "drawer";
}

export function Sidebar({
  collapsed = false,
  onToggleCollapsed,
  onNavigate,
}: SidebarProps) {
  const pathname = usePathname();
  const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);
  const { t } = useTranslation("sidebar");

  useEffect(() => {
    setMounted(true);
    try {
      const stored = localStorage.getItem(GROUP_STORAGE_KEY);
      if (stored) {
        setGroupOpen(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const persistGroups = useCallback((next: Record<string, boolean>) => {
    try {
      localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const toggleGroup = (label: string) => {
    setGroupOpen((prev) => {
      const next = { ...prev, [label]: !prev[label] };
      persistGroups(next);
      return next;
    });
  };

  const isGroupActive = (group: NavGroup): boolean => {
    return group.items.some((item) => isItemActive(pathname, item));
  };

  const shouldOpenGroup = (group: NavGroup): boolean => {
    const stored = groupOpen[group.label];
    if (stored !== undefined) return stored;
    if (group.defaultOpen) return true;
    return isGroupActive(group);
  };

  const labelFor = useCallback(
    (key: string) => t(`items.${key}`, { defaultValue: key }),
    [t],
  );
  const groupLabelFor = useCallback(
    (key: string) => t(`groups.${key}`, { defaultValue: key }),
    [t],
  );

  const expandLabel = t("expand");
  const collapseLabel = t("collapse");

  return (
    <div className="flex h-full flex-col bg-card/30">
      <div
        className={cn(
          "flex items-center gap-2 border-b border-border/60 px-4 py-4",
          collapsed && "justify-center px-2",
        )}
      >
        <Link
          href="/legalai"
          className="flex items-center gap-2 group min-w-0"
          onClick={onNavigate}
          aria-label={BRAND.shortName}
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/15 transition-colors">
            <Scale className="size-4" aria-hidden />
          </span>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-sm font-semibold tracking-tight truncate">
                {t("brandName", { defaultValue: BRAND.shortName })}
              </span>
              <span className="text-[10px] text-muted-foreground truncate">
                {t("brandTagline", { defaultValue: "Legal AI OS" })}
              </span>
            </div>
          )}
        </Link>
      </div>

      <nav
        id={SIDEBAR_ID}
        className="flex-1 overflow-y-auto py-3 px-2 space-y-1"
        aria-label={t("primaryNav")}
      >
        {NAVIGATION_GROUPS.map((group) => {
          const open = shouldOpenGroup(group);
          const active = isGroupActive(group);
          const groupLabel = groupLabelFor(group.label);
          return (
            <div key={group.label} className="mb-1">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.label)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-expanded={open}
                  aria-controls={`${SIDEBAR_ID}-group-${group.label}`}
                >
                  <span className="flex items-center gap-2">
                    {groupLabel}
                    {active && (
                      <span
                        className="size-1 rounded-full bg-primary"
                        aria-hidden
                      />
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "size-3 transition-transform duration-200",
                      !open && "-rotate-90",
                    )}
                    aria-hidden
                  />
                </button>
              )}
              <div
                id={`${SIDEBAR_ID}-group-${group.label}`}
                className={cn(
                  "space-y-0.5 mt-0.5",
                  !collapsed && !open && "hidden",
                )}
              >
                {group.items.map((item) => {
                  const Icon = item.icon as LucideIcon;
                  const itemActive = isItemActive(pathname, item);
                  const translated = labelFor(item.label);
                  const link = (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={cn(
                        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        itemActive
                          ? "bg-primary/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                        collapsed && "justify-center px-2",
                      )}
                      aria-current={itemActive ? "page" : undefined}
                      aria-label={collapsed ? translated : undefined}
                    >
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          itemActive && "text-primary",
                        )}
                        aria-hidden
                      />
                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate">{translated}</span>
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="h-5 px-1.5 text-[10px] bg-primary/15 text-primary border-0"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </>
                      )}
                    </Link>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href} delayDuration={200}>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right" sideOffset={8}>
                          {translated}
                        </TooltipContent>
                      </Tooltip>
                    );
                  }
                  return link;
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3">
        {!collapsed ? (
          <div className="rounded-lg border bg-muted/30 p-3 text-xs">
            <p className="font-medium text-foreground mb-1 flex items-center gap-1.5">
              <Sparkles className="size-3 text-primary" aria-hidden />
              {t("aiWorkspaceTitle")}
            </p>
            <p className="text-muted-foreground leading-relaxed">
              {t("aiWorkspaceDescription")}
            </p>
          </div>
        ) : (
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div
                className="flex justify-center"
                role="img"
                aria-label={t("aiWorkspaceTitle")}
              >
                <span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Sparkles className="size-3.5" aria-hidden />
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {t("aiWorkspaceTitle")}
            </TooltipContent>
          </Tooltip>
        )}
        {onToggleCollapsed && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full justify-center"
            onClick={onToggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls={SIDEBAR_ID}
            aria-label={collapsed ? expandLabel : collapseLabel}
            title={collapsed ? expandLabel : collapseLabel}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-4" aria-hidden />
            ) : (
              <>
                <PanelLeftClose className="size-4" aria-hidden />
                <span className="hidden sm:inline">
                  {collapseLabel}
                </span>
                <ChevronLeft
                  className="size-3 hidden md:inline"
                  aria-hidden
                />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

export interface SidebarWithCollapseProps {
  className?: string;
}

export function SidebarWithCollapse({ className }: SidebarWithCollapseProps = {}) {
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const { t } = useTranslation("sidebar");

  useEffect(() => {
    setHydrated(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "true") setCollapsed(true);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const expandLabel = t("expand");
  const collapseLabel = t("collapse");

  return (
    <aside
      className={cn(
        "hidden md:flex shrink-0 flex-col border-r bg-card/40 sticky top-0 h-screen transition-[width] duration-200 ease-out motion-reduce:transition-none",
        hydrated && collapsed ? "w-[68px]" : "w-64",
        className,
      )}
      aria-label={t("primaryNav")}
    >
      <Sidebar
        collapsed={hydrated && collapsed}
        onToggleCollapsed={toggle}
      />
      <span className="sr-only">
        {hydrated && collapsed ? expandLabel : collapseLabel}
      </span>
    </aside>
  );
}