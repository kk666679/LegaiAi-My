// components/matters/core/matters-breadcrumbs.tsx
"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MattersBreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface MattersBreadcrumbsProps {
  items: MattersBreadcrumbItem[];
  className?: string;
}

export function MattersBreadcrumbs({ items, className }: MattersBreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm", className)}>
      <ol className="flex items-center gap-1">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {item.href ? (
                <a href={item.href} className="text-muted-foreground hover:text-foreground">
                  {item.label}
                </a>
              ) : item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {item.label}
                </button>
              ) : (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={isLast ? "font-medium text-foreground" : "text-muted-foreground"}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? <ChevronRight className="size-3.5 text-muted-foreground/60" aria-hidden /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
