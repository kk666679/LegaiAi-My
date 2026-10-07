"use client";
import * as React from "react";
import { StudioLayout, type OutlineSection, type StudioAIMessage, type StudioTemplate } from "@/components/documents";

const TEMPLATES: StudioTemplate[] = [
  { id: "employment", label: "Employment Agreement" },
  { id: "nda", label: "Mutual NDA" },
  { id: "services", label: "Services Agreement" },
  { id: "warning", label: "Warning Letter" },
];

const INITIAL_OUTLINE: OutlineSection[] = [
  { id: "parties", title: "Parties", status: "empty" },
  { id: "recitals", title: "Recitals", status: "empty" },
  { id: "terms", title: "Terms", status: "empty", children: [
    { id: "term", title: "Term", status: "empty" },
    { id: "payment", title: "Payment", status: "empty" },
    { id: "termination", title: "Termination", status: "empty" },
  ] },
  { id: "signatures", title: "Signatures", status: "empty" },
];

export function StudioPageClient() {
  const [title, setTitle] = React.useState("Untitled document");
  const [templateId, setTemplateId] = React.useState("employment");
  const [body, setBody] = React.useState("");
  const [sections] = React.useState(INITIAL_OUTLINE);
  const [activeSectionId, setActiveSectionId] = React.useState<string>("terms");
  const [messages] = React.useState<StudioAIMessage[]>([]);

  return (
    <StudioLayout
      title={title}
      status="Draft"
      templates={TEMPLATES}
      templateId={templateId}
      onTemplateChange={setTemplateId}
      sections={sections}
      activeSectionId={activeSectionId}
      onSectionSelect={setActiveSectionId}
      body={body}
      onBodyChange={setBody}
      messages={messages}
      onSave={() => { /* POST /api/documents */ }}
      onExport={() => { /* POST /api/documents/export */ }}
    />
  );
}
