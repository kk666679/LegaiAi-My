"use client";

import { Textarea } from "@/components/ui/textarea";

export function StudioEditor({
  value,
  onChange,
  title,
  subtitle,
  status,
}: {
  value: string;
  onChange: (value: string) => void;
  title: string;
  subtitle?: string;
  status: string;
}) {
  return (
    <section className="mx-auto max-w-3xl space-y-4">
      <header>
        <p className="text-xs text-muted-foreground">{subtitle ?? status}</p>
        <h1 className="text-2xl font-semibold">{title}</h1>
      </header>
      <Textarea
        aria-label="Document body"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        className="min-h-[60vh] resize-y leading-7"
      />
    </section>
  );
}
