"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, X, Bot, Briefcase, Globe, FileText } from "lucide-react";
import { LEGAL_AREAS, JURISDICTIONS } from "@/lib/lawmate/data";
import type { ComposerContext } from "@/types/lawmate";

interface QuickPromptSheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStart?: (text: string, ctx: ComposerContext) => void;
}

const STARTERS = [
  "Review this clause for compliance with Malaysian employment law.",
  "Summarise the key obligations of this Act.",
  "Identify the legal risks in the attached document.",
  "Compare these two contracts and summarise differences.",
  "Draft a compliant payment clause for a services agreement.",
  "Explain Section 24 of the Employment Act 1955 in plain English.",
];

const SUGGESTIONS = [
  {
    title: "Analyse an uploaded document",
    description: "Extract clauses, obligations, parties and risks.",
    icon: FileText,
    prompt: "Analyse the attached document and identify clauses, obligations, parties and risks.",
  },
  {
    title: "Research Malaysian law",
    description: "Search statutes, cases and guidelines.",
    icon: Globe,
    prompt: "Research current Malaysian employment law on salary deductions and summarise the requirements.",
  },
  {
    title: "Draft a legal document",
    description: "Generate a draft with AI assistance.",
    icon: Sparkles,
    prompt: "Draft a warning letter for an employee misconduct incident.",
  },
  {
    title: "Compare documents",
    description: "Side-by-side comparison with risk analysis.",
    icon: Bot,
    prompt: "Compare the two attached contracts and summarise key differences in obligations.",
  },
];

export function QuickPromptSheet({
  open,
  onOpenChange,
  onStart,
}: QuickPromptSheetProps) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [area, setArea] = useState("Employment");
  const [jurisdiction, setJurisdiction] = useState("Malaysia");

  const start = (prompt: string) => {
    if (!prompt.trim()) return;
    onStart?.(prompt, {
      jurisdiction: jurisdiction as any,
      area: area as any,
      sourceFilter: ["act", "case", "guideline", "government"],
    });
    setText("");
    onOpenChange(false);
    router.push("/lawmate/assistant");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg flex flex-col"
      >
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" /> Ask LawMate
          </SheetTitle>
          <SheetDescription>
            Start an AI conversation with Malaysian legal context.
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <div>
            <label className="text-xs font-medium">Your question</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Describe your legal question in detail…"
              rows={4}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium">Jurisdiction</label>
              <Select value={jurisdiction} onValueChange={setJurisdiction}>
                <SelectTrigger className="mt-1">
                  <Globe className="size-3 mr-1" />
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
            </div>
            <div>
              <label className="text-xs font-medium">Area</label>
              <Select value={area} onValueChange={setArea}>
                <SelectTrigger className="mt-1">
                  <Briefcase className="size-3 mr-1" />
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
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2">Quick starters</p>
            <div className="flex flex-wrap gap-2">
              {STARTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setText(s)}
                  className="rounded-full border bg-card px-3 py-1 text-xs text-left hover:bg-accent transition-colors"
                >
                  {s.length > 60 ? s.slice(0, 60) + "…" : s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium mb-2">Or pick an action</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SUGGESTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.title}
                    onClick={() => start(s.prompt)}
                    className="rounded-lg border bg-card p-3 text-left hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="size-3.5 text-primary" />
                      <p className="text-sm font-medium">{s.title}</p>
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {s.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="border-t p-4 flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            AI assistance — verify before relying.
          </p>
          <Button
            disabled={!text.trim()}
            onClick={() => start(text)}
            className="gap-2"
          >
            <Sparkles className="size-4" /> Start
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}