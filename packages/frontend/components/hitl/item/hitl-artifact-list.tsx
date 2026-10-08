// components/hitl/item/hitl-artifact-list.tsx
"use client";

import * as React from "react";
import {
  BarChart3,
  FileSignature,
  FileText,
  Receipt,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { HITLArtifact } from "../types";

const ICON: Record<HITLArtifact["kind"], React.ReactNode> = {
  document: <FileText className="size-4" />,
  draft: <ScrollText className="size-4" />,
  clause: <FileText className="size-4" />,
  analysis: <Sparkles className="size-4" />,
  invoice: <Receipt className="size-4" />,
  matter: <FileSignature className="size-4" />,
  contract: <FileSignature className="size-4" />,
  note: <FileText className="size-4" />,
  json: <BarChart3 className="size-4" />,
  text: <FileText className="size-4" />,
};

export interface HITLArtifactListProps {
  artifacts: HITLArtifact[];
  onSelect?: (a: HITLArtifact) => void;
  className?: string;
}

export function HITLArtifactList({ artifacts, onSelect, className }: HITLArtifactListProps) {
  if (!artifacts.length) return null;
  return (
    <ul className={cn("space-y-2", className)}>
      {artifacts.map((a) => (
        <li key={a.id}>
          <Card
            role={onSelect ? "button" : undefined}
            tabIndex={onSelect ? 0 : undefined}
            onClick={() => onSelect?.(a)}
            onKeyDown={(e) => {
              if (onSelect && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onSelect(a);
              }
            }}
            className={cn(
              "flex items-start gap-3 p-3",
              onSelect && "cursor-pointer transition-colors hover:border-primary/40",
            )}
          >
            <div className="rounded-md bg-muted p-2 text-muted-foreground">{ICON[a.kind]}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium">{a.label}</p>
                {a.domain ? (
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {a.domain}
                  </Badge>
                ) : null}
              </div>
              {a.preview ? (
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.preview}</p>
              ) : null}
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}