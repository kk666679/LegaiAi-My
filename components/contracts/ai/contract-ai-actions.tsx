"use client";
import * as React from "react";
import { AlertTriangle, BookOpen, Calendar, FileSearch, Languages, ListChecks, ScrollText, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ContractAIAction { id: string; label: string; icon?: React.ReactNode; prompt?: string; }
export interface ContractAIActionsProps { actions?: ContractAIAction[]; onAction?: (id: string, label: string, prompt?: string) => void; }

const DEFAULT_ACTIONS: ContractAIAction[] = [
  { id: "summarise", label: "Summarise", icon: <ScrollText className="size-3.5" />, prompt: "Summarise the contract in plain English." },
  { id: "risks", label: "Find risks", icon: <AlertTriangle className="size-3.5" />, prompt: "Identify all material risks with severity." },
  { id: "obligations", label: "Obligations", icon: <ListChecks className="size-3.5" />, prompt: "Extract every obligation of each party." },
  { id: "dates", label: "Key dates", icon: <Calendar className="size-3.5" />, prompt: "Extract all key dates and deadlines." },
  { id: "clauses", label: "Extract clauses", icon: <BookOpen className="size-3.5" />, prompt: "Segment the contract into clauses and categorise them." },
  { id: "playbook", label: "Check playbook", icon: <FileSearch className="size-3.5" />, prompt: "Compare clauses against our playbook positions." },
  { id: "translate", label: "Translate", icon: <Languages className="size-3.5" />, prompt: "Translate the contract into Bahasa Malaysia." },
  { id: "rewrite", label: "Rewrite risky clause", icon: <Wand2 className="size-3.5" />, prompt: "Rewrite the selected clause in a more balanced way." },
];

export function ContractAIActions({ actions = DEFAULT_ACTIONS, onAction }: ContractAIActionsProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {actions.map((a) => (
        <Button key={a.id} size="sm" variant="outline" className="gap-1.5" onClick={() => onAction?.(a.id, a.label, a.prompt)}>
          {a.icon ?? <Sparkles className="size-3.5" />}{a.label}
        </Button>
      ))}
    </div>
  );
}
