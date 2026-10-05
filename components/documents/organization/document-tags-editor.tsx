"use client";
import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { DocumentTag } from "../types";

export interface DocumentTagsEditorProps { tags: DocumentTag[]; onChange?: (tags: DocumentTag[]) => void; placeholder?: string; }

export function DocumentTagsEditor({ tags, onChange, placeholder = "Add tag…" }: DocumentTagsEditorProps) {
  const [draft, setDraft] = React.useState("");
  const add = () => {
    const label = draft.trim();
    if (!label) return;
    if (tags.some((t) => t.label.toLowerCase() === label.toLowerCase())) { setDraft(""); return; }
    onChange?.([...tags, { id: `tag-${Date.now()}`, label }]);
    setDraft("");
  };
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5">
      {tags.map((t) => (
        <Badge key={t.id} variant="secondary" className="gap-1 pr-1 text-xs">
          {t.label}
          <button type="button" onClick={() => onChange?.(tags.filter((x) => x.id !== t.id))} className="rounded-sm p-0.5 hover:bg-background/60" aria-label={`Remove tag ${t.label}`}><X className="size-3" /></button>
        </Badge>
      ))}
      <Input value={draft} onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); } }}
        onBlur={add}
        placeholder={placeholder}
        className="h-6 w-24 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus-visible:ring-0" aria-label="Add tag" />
    </div>
  );
}
