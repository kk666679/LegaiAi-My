// components/automation/search/workflow-search.tsx
"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface WorkflowSearchProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function WorkflowSearch({
  value,
  onChange,
  placeholder = "Search automations",
  className,
}: WorkflowSearchProps) {
  const [local, setLocal] = React.useState(value ?? "");
  React.useEffect(() => setLocal(value ?? ""), [value]);
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={local}
        onChange={(e) => {
          setLocal(e.target.value);
          onChange?.(e.target.value);
        }}
        placeholder={placeholder}
        aria-label="Search automations"
        className="pl-9 pr-9"
      />
      {local ? (
        <Button
          size="icon"
          variant="ghost"
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
