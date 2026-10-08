"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { FileText, FileSignature, ScrollText, BookOpen } from "lucide-react";

export interface DocumentTypeOption { id: string; label: string; description?: string; icon?: React.ReactNode; }
export interface DocumentTypeSelectorProps { types?: DocumentTypeOption[]; value?: string; onChange?: (id: string) => void; className?: string; }
const DEFAULT_TYPES: DocumentTypeOption[] = [
  { id: "contract", label: "Contract", description: "Binding agreement between parties", icon: <FileSignature className="size-4" /> },
  { id: "letter", label: "Letter", description: "Formal correspondence", icon: <FileText className="size-4" /> },
  { id: "memo", label: "Memorandum", description: "Internal legal advice", icon: <ScrollText className="size-4" /> },
  { id: "opinion", label: "Opinion", description: "Formal legal opinion", icon: <BookOpen className="size-4" /> },
];

export function DocumentTypeSelector({ types = DEFAULT_TYPES, value, onChange, className }: DocumentTypeSelectorProps) {
  return (
    <div role="radiogroup" className={cn("grid grid-cols-1 gap-2 sm:grid-cols-2", className)}>
      {types.map((t) => (
        <Card key={t.id} role="radio" aria-checked={value === t.id} tabIndex={0}
          onClick={() => onChange?.(t.id)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange?.(t.id); } }}
          className={cn("flex cursor-pointer items-start gap-3 p-3 transition-colors hover:border-primary/40", value === t.id && "border-primary/60 bg-accent/30")}>
          <span className="rounded-md bg-muted p-2 text-muted-foreground">{t.icon}</span>
          <span className="min-w-0">
            <span className="block text-sm font-medium">{t.label}</span>
            {t.description ? <span className="block text-xs text-muted-foreground">{t.description}</span> : null}
          </span>
        </Card>
      ))}
    </div>
  );
}
