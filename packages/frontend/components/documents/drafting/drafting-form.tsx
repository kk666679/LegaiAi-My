"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface DraftingFormValues { title: string; parties?: string; jurisdiction?: string; keyFacts?: string; instructions?: string; }
export interface DraftingFormProps { value: DraftingFormValues; onChange: (v: DraftingFormValues) => void; className?: string; }

export function DraftingForm({ value, onChange, className }: DraftingFormProps) {
  const set = (patch: Partial<DraftingFormValues>) => onChange({ ...value, ...patch });
  return (
    <div className={cn("grid gap-3", className)}>
      <div><Label htmlFor="draft-title">Document title</Label><Input id="draft-title" value={value.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Employment Agreement" /></div>
      <div><Label htmlFor="draft-parties">Parties</Label><Input id="draft-parties" value={value.parties ?? ""} onChange={(e) => set({ parties: e.target.value })} placeholder="e.g. TechNova Sdn Bhd and Lim Wei Jian" /></div>
      <div><Label htmlFor="draft-jur">Jurisdiction</Label><Input id="draft-jur" value={value.jurisdiction ?? ""} onChange={(e) => set({ jurisdiction: e.target.value })} placeholder="Malaysia" /></div>
      <div><Label htmlFor="draft-facts">Key facts</Label><Textarea id="draft-facts" rows={4} value={value.keyFacts ?? ""} onChange={(e) => set({ keyFacts: e.target.value })} placeholder="Background and material facts…" /></div>
      <div><Label htmlFor="draft-inst">Instructions</Label><Textarea id="draft-inst" rows={3} value={value.instructions ?? ""} onChange={(e) => set({ instructions: e.target.value })} placeholder="Any tone, emphasis, or specific clauses…" /></div>
    </div>
  );
}

import { cn } from "@/lib/utils";
