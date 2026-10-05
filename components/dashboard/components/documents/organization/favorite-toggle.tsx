// components/documents/organization/favorite-toggle.tsx
"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FavoriteToggleProps {
  active: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}

export function FavoriteToggle({ active, onChange, className }: FavoriteToggleProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("size-7 text-muted-foreground", className)}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Add to favorites"}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!active);
      }}
    >
      <Star
        className={cn("size-4", active && "fill-amber-400 text-amber-400")}
        aria-hidden
      />
    </Button>
  );
}
