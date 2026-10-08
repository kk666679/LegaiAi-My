"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { DOCUMENT_COLLECTIONS, type DocumentCollectionId } from "./types";

export function DocumentCollections({
  active = "all",
  counts = {},
  onSelect,
  disabledCollections = [],
  className,
}: {
  active?: DocumentCollectionId;
  counts?: Partial<Record<DocumentCollectionId, number>>;
  onSelect?: (collection: DocumentCollectionId) => void;
  disabledCollections?: DocumentCollectionId[];
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Collections</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-1">
        {DOCUMENT_COLLECTIONS.map((collection) => {
          const Icon = collection.icon;
          const selected = collection.id === active;
          const disabled = disabledCollections.includes(collection.id);
          return (
            <button
              key={collection.id}
              type="button"
              onClick={() => onSelect?.(collection.id)}
              aria-pressed={selected}
              aria-disabled={disabled}
              disabled={disabled}
              title={disabled ? "This collection is not available yet" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                disabled && "cursor-not-allowed opacity-50",
                selected
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon aria-hidden />
              <span className="min-w-0 flex-1 truncate">{collection.label}</span>
              {counts[collection.id] !== undefined ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {counts[collection.id]}
                </span>
              ) : null}
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default DocumentCollections;
