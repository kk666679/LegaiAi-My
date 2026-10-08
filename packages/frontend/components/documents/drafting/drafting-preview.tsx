"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";

export function DraftingPreview({ body, title }: { body: string; title?: string }) {
  return (
    <Card className="h-full overflow-auto p-6">
      {title ? <h2 className="mb-4 text-lg font-semibold">{title}</h2> : null}
      <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">{body}</pre>
    </Card>
  );
}
