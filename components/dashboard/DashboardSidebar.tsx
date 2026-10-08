"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { BRAND } from "@/lib/brand";
import {
  NAVIGATION_GROUPS,
  isItemActive,
  type NavGroup,
} from "@/lib/navigation";
import { useTranslation } from "@/i18n/hooks/use-translation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { LawMateMark } from "@/components/navigation/Logo";

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
const { t } = useTranslation("sidebar");

const [groupOpen, setGroupOpen] = useState<Record<string, boolean>>({});
const [groupsHydrated, setGroupsHydrated] = useState(false);

useEffect(() => {
try {
const stored = localStorage.getItem(GROUP_STORAGE_KEY);

  if (stored) {
    const parsed = JSON.parse(stored);

    if (parsed && typeof parsed === "object") {
      setGroupOpen(parsed);
    }
  }
} catch {
  // Ignore invalid or unavailable localStorage.
} finally {
  setGroupsHydrated(true);
}

}, []);

const persistGroups = useCallback(
(groups: Record<string, boolean>) => {
try {
localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
} catch {
// Ignore unavailable localStorage.
}
},
[],
);

const toggleGroup = useCallback(
(label: string) => {
setGroupOpen((current) => {
const next = {
...current,
[label]: !current[label],
};

    persistGroups(next);
    return next;
  });
},
[persistGroups],

);

const isGroupActive = useCallback(
(group: NavGroup) =>
group.items.some((item) => isItemActive(pathname, item)),
[pathname],
);

const shouldOpenGroup = useCallback(
(group: NavGroup) => {
if (!groupsHydrated) {
return group.defaultOpen ?? false;
}

  const stored = groupOpen[group.label];

  if (stored !== undefined) {
    return stored;
  }

  return Boolean(group.defaultOpen || isGroupActive(group));
},
[groupOpen, groupsHydrated, isGroupActive],

);

const itemLabel = useCallback(
(key: string) => t(`items.${key}`, { defaultValue: key }),
[t],
);

const groupLabel = useCallback(
(key: string) => t(`groups.${key}`, { defaultValue: key }),
[t],
);

const expandLabel = t("expand");
const collapseLabel = t("collapse");

return (
<div className="flex h-full flex-col bg-card/30">
<SidebarBrand
collapsed={collapsed}
onNavigate={onNavigate}
brandName={t("brandName", { defaultValue: BRAND.shortName })}
tagline={t("brandTagline", { defaultValue: "Legal AI OS" })}
/>

  <nav
    id={SIDEBAR_ID}
    aria-label={t("primaryNav")}
    className="flex-1 space-y-1 overflow-y-auto px-2 py-3"
  >
    {NAVIGATION_GROUPS.map((group) => {
      const active = isGroupActive(group);
      const open = shouldOpenGroup(group);
      const translatedGroupLabel = groupLabel(group.label);
      const groupId = `${SIDEBAR_ID}-group-${group.label}`;

      return (
        <div key={group.label} className="mb-1">
          {!collapsed && (
            <button
              type="button"
              onClick={() => toggleGroup(group.label)}
              aria-expanded={open}
              aria-controls={groupId}
              className={cn(
                "flex w-full items-center justify-between rounded-md px-2.5 py-1.5",
                "text-[10px] font-semibold uppercase tracking-wider",
                "transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <span className="flex items-center gap-2">
                {translatedGroupLabel}

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
            id={groupId}
            className={cn(
              "mt-0.5 space-y-0.5",
              !collapsed && !open && "hidden",
            )}
          >
            {group.items.map((item) => {
              const Icon = item.icon as LucideIcon;
              const activeItem = isItemActive(pathname, item);
              const label = itemLabel(item.label);

              const link = (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  aria-current={activeItem ? "page" : undefined}
                  aria-label={collapsed ? label : undefined}
                  className={cn(
                    "group flex items-center gap-3 rounded-md px-3 py-2 text-sm",
                    "transition-colors",
                    activeItem
                      ? "bg-primary/10 font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0",
                      activeItem && "text-primary",
                    )}
                    aria-hidden
                  />

                  {!collapsed && (
                    <>
                      <span className="min-w-0 flex-1 truncate">
                        {label}
                      </span>

                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="h-5 border-0 bg-primary/15 px-1.5 text-[10px] text-primary"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              );

              if (!collapsed) {
                return link;
              }

              return (
                <Tooltip key={item.href} delayDuration={200}>
                  <TooltipTrigger asChild>{link}</TooltipTrigger>

                  <TooltipContent side="right" sideOffset={8}>
                    {label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </div>
      );
    })}
  </nav>

  <Separator />

  <SidebarFooter
    collapsed={collapsed}
    onToggleCollapsed={onToggleCollapsed}
    expandLabel={expandLabel}
    collapseLabel={collapseLabel}
    aiTitle={t("aiWorkspaceTitle")}
    aiDescription={t("aiWorkspaceDescription")}
  />
</div>

);
}

interface SidebarBrandProps {
collapsed: boolean;
onNavigate?: () => void;
brandName: string;
tagline: string;
}

function SidebarBrand({
  collapsed,
  onNavigate,
  brandName,
  tagline,
}: SidebarBrandProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 border-b border-border/60 px-4 py-4",
        collapsed && "justify-center px-2",
      )}
    >
      <Link href="/lawmate" onClick={onNavigate} aria-label={brandName} className="group flex min-w-0 items-center gap-2" >
        <LawMateMark size="md" className="shrink-0" aria-hidden="true" />

        {!collapsed && (
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold tracking-tight text-foreground">
              {brandName}
            </span>

            <span className="truncate text-[10px] text-muted-foreground">
              {tagline}
            </span>
          </div>
        )}
      </Link>
    </div>
  );
}

interface SidebarFooterProps {
collapsed: boolean;
onToggleCollapsed?: () => void;
expandLabel: string;
collapseLabel: string;
aiTitle: string;
aiDescription: string;
}

function SidebarFooter({
collapsed,
onToggleCollapsed,
expandLabel,
collapseLabel,
aiTitle,
aiDescription,
}: SidebarFooterProps) {
return (
<div className="p-3">
{collapsed ? (
<Tooltip delayDuration={200}>
<TooltipTrigger asChild>
<div role="img" aria-label={aiTitle} className="flex justify-center" >
<span className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
<Sparkles className="size-3.5" aria-hidden />
</span>
</div>
</TooltipTrigger>

      <TooltipContent side="right" sideOffset={8}>
        {aiTitle}
      </TooltipContent>
    </Tooltip>
  ) : (
    <div className="rounded-lg border bg-muted/30 p-3 text-xs">
      <p className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
        <Sparkles className="size-3 text-primary" aria-hidden />
        {aiTitle}
      </p>

      <p className="leading-relaxed text-muted-foreground">
        {aiDescription}
      </p>
    </div>
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
            className="hidden size-3 md:inline"
            aria-hidden
          />
        </>
      )}
    </Button>
  )}
</div>

);
}

export interface SidebarWithCollapseProps {
className?: string;
}

export function SidebarWithCollapse({
className,
}: SidebarWithCollapseProps = {}) {
const { t } = useTranslation("sidebar");

const [collapsed, setCollapsed] = useState(false);
const [hydrated, setHydrated] = useState(false);

useEffect(() => {
try {
const stored = localStorage.getItem(STORAGE_KEY);

  if (stored === "true") {
    setCollapsed(true);
  }
} catch {
  // Ignore unavailable localStorage.
} finally {
  setHydrated(true);
}

}, []);

const toggle = useCallback(() => {
setCollapsed((current) => {
const next = !current;

  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // Ignore unavailable localStorage.
  }

  return next;
});

}, []);

const isCollapsed = hydrated && collapsed;

return (
<aside
aria-label={t("primaryNav")}
className={cn(
"sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card/40",
"transition-[width] duration-200 ease-out motion-reduce:transition-none",
isCollapsed ? "w-[68px]" : "w-64",
className,
)}
>
<Sidebar collapsed={isCollapsed} onToggleCollapsed={toggle} />

  <span className="sr-only">
    {isCollapsed
      ? t("expand")
      : t("collapse")}
  </span>
</aside>

);
}