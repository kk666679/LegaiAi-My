// components/matters/search/matter-search-bar.tsx
"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface MatterSearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MatterSearchBar({
  value,
  onChange,
  placeholder = "Search matters, clients, matter numbers…",
  className,
}: MatterSearchBarProps) {
  const [local, setLocal] = React.useState(value ?? "");
  React.useEffect(() => setLocal(value ?? ""), [value]);
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <Input
        value={local}
        placeholder={placeholder}
        aria-label="Search matters"
        onChange={(e) => {
          setLocal(e.target.value);
          onChange?.(e.target.value);
        }}
        className="pl-9 pr-9"
      />
      {local ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 size-7 -translate-y-1/2"
          aria-label="Clear search"
          onClick={() => {
            setLocal("");
            onChange?.("");
          }}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </div>
  );
}
