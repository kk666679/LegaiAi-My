"use client";
import * as React from "react";
import { TemplateSelector } from "./template-selector";
import type { DocumentTemplate } from "../types";

export function DocumentTemplates({ templates, onSelect }: { templates: DocumentTemplate[]; onSelect?: (t: DocumentTemplate) => void }) {
  return <TemplateSelector templates={templates} onSelect={onSelect} />;
}
