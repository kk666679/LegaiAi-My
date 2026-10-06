"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_TEMPLATES } from "@/components/automation";
import { TemplateCard } from "@/components/automation/templates/template-card";

export function TemplatesGalleryPage() {
  const router = useRouter();
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Templates</h1>
        <p className="text-xs text-muted-foreground">Start from a tested workflow and customize it.</p>
      </header>
      <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {DEFAULT_TEMPLATES.map((t) => (
          <TemplateCard key={t.id} template={t} onUse={() => router.push(`/legalai/automations/new?template=${t.id}`)} />
        ))}
      </div>
    </div>
  );
}
