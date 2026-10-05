"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

export interface DocumentAISuggestion { id: string; label: string; prompt: string; }
export interface DocumentAISuggestionsProps { suggestions?: DocumentAISuggestion[]; onSelect?: (s: DocumentAISuggestion) => void; }

const DEFAULT: DocumentAISuggestion[] = [
  { id: "summary", label: "Summarise", prompt: "Summarise this document" },
  { id: "risks", label: "Find risks", prompt: "Identify legal risks" },
  { id: "obligations", label: "Obligations", prompt: "List obligations of each party" },
  { id: "dates", label: "Key dates", prompt: "Extract important dates" },
  { id: "parties", label: "Parties", prompt: "Identify parties and roles" },
];

export function DocumentAISuggestions({ suggestions = DEFAULT, onSelect }: DocumentAISuggestionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((s) => <Button key={s.id} size="sm" variant="outline" onClick={() => onSelect?.(s)}>{s.label}</Button>)}
    </div>
  );
}
