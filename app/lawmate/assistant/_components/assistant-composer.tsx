"use client";
// app/ai/_components/assistant-composer.tsx
import * as React from "react";
import { ArrowUp, Paperclip, Square, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface AIAssistantComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onStop: () => void;
  streaming: boolean;
  className?: string;
}

export function AIAssistantComposer({
  value,
  onChange,
  onSubmit,
  onStop,
  streaming,
  className,
}: AIAssistantComposerProps) {
  const ref = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow the textarea
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!streaming) onSubmit();
    }
  };

  return (
    <div className={cn("border-t border-border/60 bg-background/95 backdrop-blur", className)}>
      <div className="mx-auto w-full max-w-3xl px-4 py-3">
        <div className="relative rounded-xl border border-border/60 bg-card shadow-sm focus-within:border-primary/60">
          <Textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a legal question, paste a clause, or describe what you need…"
            rows={1}
            className="min-h-[52px] resize-none border-0 bg-transparent px-3 py-3 pr-28 text-sm shadow-none focus-visible:ring-0"
            aria-label="Message"
          />

          <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-center justify-between">
            <div className="pointer-events-auto flex items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground"
                aria-label="Attach file"
                onClick={() => toast.info("File attachments are not available in this assistant yet.")}
              >
                <Paperclip className="size-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-7 text-muted-foreground"
                aria-label="Improve prompt"
                onClick={() => toast.info("Prompt improvement is not available yet.")}
              >
                <Wand2 className="size-4" />
              </Button>
            </div>

            <div className="pointer-events-auto">
              {streaming ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5"
                  onClick={onStop}
                >
                  <Square className="size-3 fill-current" />
                  Stop
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  className="size-8 rounded-lg"
                  disabled={!value.trim()}
                  onClick={onSubmit}
                  aria-label="Send"
                >
                  <ArrowUp className="size-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        <p className="mt-2 text-center text-[11px] text-muted-foreground">
          LegAI can make mistakes. Verify citations before relying on them.
        </p>
      </div>
    </div>
  );
}
