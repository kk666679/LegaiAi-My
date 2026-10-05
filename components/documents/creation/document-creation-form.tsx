"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface DocumentCreationFormValues { name: string; description?: string; category?: string; jurisdiction?: string; language?: string; }
export interface DocumentCreationFormProps { value: DocumentCreationFormValues; onChange: (v: DocumentCreationFormValues) => void; className?: string; }

export function DocumentCreationForm({ value, onChange, className }: DocumentCreationFormProps) {
  const set = (patch: Partial<DocumentCreationFormValues>) => onChange({ ...value, ...patch });
  return (
    <div className={className}>
      <div className="grid gap-3">
        <div>
          <Label htmlFor="doc-name">Name *</Label>
          <Input id="doc-name" value={value.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Employment Agreement — Ali bin Ahmad" />
        </div>
        <div>
          <Label htmlFor="doc-desc">Description</Label>
          <Textarea id="doc-desc" rows={3} value={value.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder="Short summary…" />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor="doc-cat">Category</Label>
            <Input id="doc-cat" value={value.category ?? ""} onChange={(e) => set({ category: e.target.value })} placeholder="Employment" />
          </div>
          <div>
            <Label htmlFor="doc-jur">Jurisdiction</Label>
            <Input id="doc-jur" value={value.jurisdiction ?? ""} onChange={(e) => set({ jurisdiction: e.target.value })} placeholder="Malaysia" />
          </div>
          <div>
            <Label htmlFor="doc-lang">Language</Label>
            <Input id="doc-lang" value={value.language ?? ""} onChange={(e) => set({ language: e.target.value })} placeholder="English" />
          </div>
        </div>
      </div>
    </div>
  );
}
