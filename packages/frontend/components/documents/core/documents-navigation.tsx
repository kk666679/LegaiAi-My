// components/documents/core/documents-navigation.tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderTree,
  FileText,
  Star,
  Clock,
  Users,
  Archive,
  FileSignature,
  PenLine,
  LayoutTemplate,
  Share2,
} from "lucide-react";

export interface DocumentsNavItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  count?: number;
  href?: string;
  active?: boolean;
  onSelect?: () => void;
}

export interface DocumentsNavigationProps {
  items?: DocumentsNavItem[];
  className?: string;
}

const DEFAULT_ITEMS: DocumentsNavItem[] = [
  { id: "all", label: "All Documents", icon: <FileText className="size-4" /> },
  { id: "recent", label: "Recent", icon: <Clock className="size-4" /> },
  { id: "favorites", label: "Favorites", icon: <Star className="size-4" /> },
  { id: "shared", label: "Shared", icon: <Share2 className="size-4" /> },
  { id: "contracts", label: "Contracts", icon: <FileSignature className="size-4" /> },
  { id: "drafts", label: "Drafts", icon: <PenLine className="size-4" /> },
  { id: "templates", label: "Templates", icon: <LayoutTemplate className="size-4" /> },
  { id: "archived", label: "Archived", icon: <Archive className="size-4" /> },
];

export function DocumentsNavigation({
  items = DEFAULT_ITEMS,
  className,
}: DocumentsNavigationProps) {
  const [active, setActive] = React.useState<string>(
    items.find((i) => i.active)?.id ?? items[0]?.id ?? "all",
  );

  return (
    <nav aria-label="Documents" className={cn("flex h-full flex-col", className)}>
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
                  className={cn(
                    "w-full justify-start gap-2",
                    isActive && "font-medium",
                  )}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setActive(item.id);
                    item.onSelect?.();
                  }}
                >
                  {item.icon ?? <FolderTree className="size-4" />}
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
      <div className="border-t border-border/60 p-3 text-xs text-muted-foreground">
        <Users className="mr-1 inline size-3" aria-hidden /> Shared workspace
      </div>
    </nav>
  );
}
