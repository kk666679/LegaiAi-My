"use client";
import * as React from "react";
import type { DocumentTemplate } from "../types";
import { TemplateCard } from "./template-card";

export function TemplateList({ templates, onUse, onPreview }: { templates: DocumentTemplate[]; onUse?: (t: DocumentTemplate) => void; onPreview?: (t: DocumentTemplate) => void }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{templates.map((t) => <TemplateCard key={t.id} template={t} onUse={onUse} onPreview={onPreview} />)}</div>;
}
