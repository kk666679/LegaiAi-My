"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Wand2, Languages, Shield, ListChecks, AlertTriangle } from "lucide-react";

const ACTIONS = [
  { id: "improve", label: "Improve", icon: <Wand2 className="size-3.5" /> },
  { id: "formal", label: "More formal", icon: <Shield className="size-3.5" /> },
  { id: "consistency", label: "Consistency", icon: <ListChecks className="size-3.5" /> },
  { id: "risks", label: "Find risks", icon: <AlertTriangle className="size-3.5" /> },
  { id: "translate", label: "Translate", icon: <Languages className="size-3.5" /> },
];

export function DraftingActions({ onAction }: { onAction?: (id: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {ACTIONS.map((a) => <Button key={a.id} size="sm" variant="outline" className="gap-1.5" onClick={() => onAction?.(a.id)}>{a.icon}{a.label}</Button>)}
    </div>
  );
}
