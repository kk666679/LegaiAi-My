"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DocumentTemplates, type DocumentTemplate } from "@/components/documents";

export function TemplatesPage() {
  const router = useRouter();
  const [templates] = React.useState<DocumentTemplate[]>([]);
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Templates</h1>
        <p className="text-xs text-muted-foreground">Start from a tested legal document foundation.</p>
      </header>
      <div className="p-4">
        <DocumentTemplates
          templates={templates}
          onSelect={(t) => router.push(`/legalai/documents/new?template=${t.id}`)}
        />
      </div>
    </div>
  );
}
