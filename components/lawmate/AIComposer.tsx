"use client";

import { useState } from "react";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  Suggestion,
  Suggestions,
} from "@/components/ai-elements/suggestion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Paperclip, Globe, Briefcase, FileText, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JURISDICTIONS, LEGAL_AREAS, PROMPT_SUGGESTIONS } from "@/lib/lawmate/data";
import { cn } from "@/lib/utils";
import type { ComposerContext, PromptSuggestion } from "@/types/lawmate";

interface AIComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  onStop?: () => void;
  context?: ComposerContext;
  onContextChange?: (c: ComposerContext) => void;
  suggestions?: PromptSuggestion[];
  showAttachments?: boolean;
  placeholder?: string;
  onAttach?: () => void;
  attachmentsCount?: number;
  compact?: boolean;
}

const SUGGESTION_CATEGORIES: { id: PromptSuggestion["category"]; label: string }[] = [
  { id: "review", label: "Review" },
  { id: "research", label: "Research" },
  { id: "analyse", label: "Analyse" },
  { id: "draft", label: "Draft" },
  { id: "compare", label: "Compare" },
];

export function AIComposer({
  value,
  onChange,
  onSubmit,
  isLoading,
  onStop,
  context,
  onContextChange,
  suggestions,
  showAttachments = true,
  placeholder = "Ask LawMate — describe your legal issue or question…",
  onAttach,
  attachmentsCount = 0,
  compact = false,
}: AIComposerProps) {
  const [category, setCategory] = useState<PromptSuggestion["category"] | "all">("all");
  const list = (suggestions ?? PROMPT_SUGGESTIONS).filter(
    (s) => category === "all" || s.category === category,
  );

  const setContext = (patch: Partial<ComposerContext>) => {
    onContextChange?.({ ...(context ?? {}), ...patch });
  };

  return (
    <div className="space-y-3">
      {!compact && suggestions && suggestions.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground">Quick prompts</span>
            {SUGGESTION_CATEGORIES.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id === category ? "all" : c.id)}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] border transition-colors",
                  category === c.id
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
          <Suggestions className="flex-wrap">
            {list.slice(0, 6).map((s) => (
              <Suggestion
                key={s.id}
                suggestion={s.label}
                onClick={(label) => onChange(`${value ? value + "\n\n" : ""}${label}`)}
              />
            ))}
          </Suggestions>
        </div>
      )}

      <PromptInput
        onSubmit={({ text }) => {
          if (!text.trim() || isLoading) return;
          onSubmit(text);
        }}
        className="border rounded-xl bg-card"
      >
        <PromptInputTextarea
          value={value}
          onChange={(e: any) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[72px] text-sm"
          rows={3}
        />

        {(context?.jurisdiction || context?.area) && (
          <div className="flex items-center gap-2 px-1 pb-1 flex-wrap">
            {context?.jurisdiction && (
              <Badge variant="secondary" className="gap-1 pr-1 text-[11px]">
                <Globe className="size-3" />
                {context.jurisdiction}
                <button
                  type="button"
                  onClick={() => setContext({ jurisdiction: undefined })}
                  className="ml-1 rounded hover:bg-foreground/10 p-0.5"
                  aria-label="Remove jurisdiction"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {context?.area && (
              <Badge variant="secondary" className="gap-1 pr-1 text-[11px]">
                <Briefcase className="size-3" />
                {context.area}
                <button
                  type="button"
                  onClick={() => setContext({ area: undefined })}
                  className="ml-1 rounded hover:bg-foreground/10 p-0.5"
                  aria-label="Remove area"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
            {context?.matterId && (
              <Badge variant="secondary" className="gap-1 pr-1 text-[11px]">
                <FileText className="size-3" />
                {context.matterId}
                <button
                  type="button"
                  onClick={() => setContext({ matterId: undefined })}
                  className="ml-1 rounded hover:bg-foreground/10 p-0.5"
                  aria-label="Remove matter"
                >
                  <X className="size-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        <PromptInputFooter className="border-t pt-2">
          <div className="flex items-center gap-2 flex-wrap">
            {showAttachments && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onAttach}
                className="gap-1.5 text-muted-foreground"
              >
                <Paperclip className="size-3.5" />
                Attach
                {attachmentsCount > 0 && (
                  <span className="ml-1 rounded-full bg-primary/15 text-primary px-1.5 text-[10px]">
                    {attachmentsCount}
                  </span>
                )}
              </Button>
            )}

            {onContextChange && (
              <>
                <Select
                  value={context?.jurisdiction ?? "Malaysia"}
                  onValueChange={(v: any) => setContext({ jurisdiction: v })}
                >
                  <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs shadow-none">
                    <Globe className="size-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JURISDICTIONS.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={context?.area ?? "Employment"}
                  onValueChange={(v: any) => setContext({ area: v })}
                >
                  <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-transparent px-2 text-xs shadow-none">
                    <Briefcase className="size-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEGAL_AREAS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </>
            )}

            <span className="ml-auto text-[11px] text-muted-foreground hidden sm:inline">
              Press <kbd className="rounded border px-1 text-[10px]">Enter</kbd>{" "}
              to send · <kbd className="rounded border px-1 text-[10px]">Shift+Enter</kbd> for newline
            </span>

            <PromptInputSubmit
              status={isLoading ? "streaming" : undefined}
              onStop={onStop}
            />
          </div>
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}