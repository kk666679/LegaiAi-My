"use client";
import * as React from "react";
import type { DocumentTemplate } from "../types";
import { TemplateCategory } from "./template-category";
import { TemplateList } from "./template-list";

export function TemplateSelector({ templates, onSelect }: { templates: DocumentTemplate[]; onSelect?: (t: DocumentTemplate) => void }) {
  const categories = React.useMemo(
    () => ["All", ...Array.from(new Set(templates.map((t) => t.category).filter((category): category is string => Boolean(category))))],
    [templates],
  );
  const [cat, setCat] = React.useState("All");
  const filtered = cat === "All" ? templates : templates.filter((t) => t.category === cat);
  return (
    <div className="space-y-3">
      <TemplateCategory categories={categories} value={cat} onChange={setCat} />
      <TemplateList templates={filtered} onUse={onSelect} />
    </div>
  );
}
