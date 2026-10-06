import { useState } from "react";

interface JsonSectionProps {
  title: string;
  value: unknown;
}

export function JsonSection({ title, value }: JsonSectionProps) {
  const [open, setOpen] = useState(false);
  const text = typeof value === "string" ? value : value == null ? null : JSON.stringify(value, null, 2);
  if (!text) return null;

  return (
    <section className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        aria-expanded={open}
      >
        {title}
        <span className="text-xs text-muted-foreground">({open ? "Hide" : "Show"})</span>
      </button>
      {open && (
        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
          {text}
        </pre>
      )}
    </section>
  );
}
