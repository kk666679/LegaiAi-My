"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";

export interface StudioSuggestion { id: string; label: string; }
export function StudioSuggestions({ suggestions, onSelect }: { suggestions: StudioSuggestion[]; onSelect?: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {suggestions.map((s) => <Button key={s.id} size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => onSelect?.(s.id)}>{s.label}</Button>)}
    </div>
  );
}
