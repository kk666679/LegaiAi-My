"use client";
import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { ContractTemplate, ContractType } from "../types";
import { ContractTemplateCard } from "./contract-template-card";

const TYPES: (ContractType | "all")[] = ["all", "nda", "services", "employment", "lease", "loan", "settlement", "mou", "distribution", "other"];

export function ContractTemplateLibrary({ templates, onUse, onPreview }: { templates: ContractTemplate[]; onUse?: (t: ContractTemplate) => void; onPreview?: (t: ContractTemplate) => void }) {
  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState<ContractType | "all">("all");
  const filtered = templates.filter((t) => (type === "all" || t.contractType === type) && (!query || t.name.toLowerCase().includes(query.toLowerCase())));
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search templates" className="pl-9" aria-label="Search templates" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TYPES.map((t) => (
          <Badge key={t} variant={type === t ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => setType(t)}>{t === "all" ? "All" : t.replace("-", " ")}</Badge>
        ))}
      </div>
      {filtered.length === 0 ? <p className="text-sm text-muted-foreground">No templates match.</p> : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((t) => <ContractTemplateCard key={t.id} template={t} onUse={onUse} onPreview={onPreview} />)}</div>
      )}
    </div>
  );
}
