"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TemplateCard } from "../templates/template-card";
import type { DocumentTemplate } from "../types";

export interface DocumentTemplateSelectorProps { templates: DocumentTemplate[]; onSelect?: (t: DocumentTemplate) => void; searchable?: boolean; className?: string; }

export function DocumentTemplateSelector({ templates, onSelect, searchable = true, className }: DocumentTemplateSelectorProps) {
  const [q, setQ] = React.useState("");
  const filtered = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return needle ? templates.filter((t) => `${t.name} ${t.category} ${(t.tags ?? []).join(" ")}`.toLowerCase().includes(needle)) : templates;
  }, [templates, q]);
  return (
    <div className={className}>
      {searchable ? (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search templates" aria-label="Search templates" className="pl-9" />
        </div>
      ) : null}
      <ScrollArea className="max-h-[420px]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((t) => <TemplateCard key={t.id} template={t} onUse={onSelect} />)}
        </div>
        {filtered.length === 0 ? <p className="p-4 text-xs text-muted-foreground">No templates match “{q}”.</p> : null}
      </ScrollArea>
    </div>
  );
}
