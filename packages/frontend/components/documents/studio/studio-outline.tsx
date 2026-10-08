"use client";

import { Button } from "@/components/ui/button";

export interface OutlineSection {
  id: string;
  title: string;
  status?: string;
  children?: OutlineSection[];
}

export function StudioOutline({
  sections,
  activeId,
  onSelect,
  onAdd,
  onReorder,
}: {
  sections: OutlineSection[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onAdd?: () => void;
  onReorder?: (fromId: string, toId: string) => void;
}) {
  return (
    <nav aria-label="Document outline" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold">Outline</h2>
        {onAdd && <Button size="sm" variant="ghost" onClick={onAdd}>Add section</Button>}
      </div>
      <ol className="space-y-1">
        {sections.map((section, index) => (
          <li key={section.id}>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant={section.id === activeId ? "secondary" : "ghost"}
                className="min-w-0 flex-1 justify-start"
                onClick={() => onSelect?.(section.id)}
              >
                {section.title}
              </Button>
              {onReorder && index > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label={`Move ${section.title} up`}
                  onClick={() => onReorder(section.id, sections[index - 1]!.id)}
                >
                  ↑
                </Button>
              )}
            </div>
          </li>
        ))}
      </ol>
      {sections.length === 0 && (
        <p className="rounded-lg border border-dashed border-border px-3 py-4 text-xs leading-5 text-muted-foreground">
          Your document outline will appear here as you organise the draft.
        </p>
      )}
    </nav>
  );
}
