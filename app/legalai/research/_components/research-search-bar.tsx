"use client";
// app/legalai/research/_components/research-search-bar.tsx
import * as React from "react";
import { ArrowUp, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ResearchSearchBarProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting?: boolean;
  placeholder?: string;
  className?: string;
  /** Large hero-style input for /research and /research/new */
  hero?: boolean;
}

export function ResearchSearchBar({
  value,
  onChange,
  onSubmit,
  submitting,
  placeholder = "Ask a legal question, describe the issue, or paste a clause…",
  className,
  hero,
}: ResearchSearchBarProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, hero ? 240 : 180)}px`;
  }, [value, hero]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!submitting && value.trim()) onSubmit();
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "relative rounded-xl border border-border/60 bg-card shadow-sm transition-shadow focus-within:border-primary/60 focus-within:shadow-md",
          hero && "rounded-2xl",
        )}
      >
        <div className={cn("flex items-start gap-3", hero ? "p-5" : "p-3")}>
          <Sparkles
            className={cn("mt-1 shrink-0 text-primary", hero ? "size-5" : "size-4")}
            aria-hidden
          />
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={hero ? 3 : 1}
            className={cn(
              "flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0",
              hero ? "min-h-[80px] text-base" : "min-h-[36px] text-sm",
            )}
            aria-label="Research query"
          />
          <Button
            type="button"
            size="icon"
            className={cn("shrink-0", hero ? "size-10" : "size-8")}
            disabled={!value.trim() || submitting}
            onClick={onSubmit}
            aria-label="Search"
          >
            <ArrowUp className={hero ? "size-5" : "size-4"} />
          </Button>
        </div>

        {hero ? (
          <div className="border-t border-border/60 px-5 py-2.5">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Search className="size-3" /> Searches Malaysian statutes, cases, and practice directions
              </span>
              <span>·</span>
              <span>AI cites every proposition</span>
              <span>·</span>
              <span>Press <kbd className="rounded bg-muted px-1 font-mono">Enter</kbd> to search</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
