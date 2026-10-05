// components/automation/inspector/node-inspector.tsx
"use client";

import * as React from "react";
import { Copy, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useAutomation } from "../core/automation-context";
import { FieldEditor } from "./field-editor";
import type { NodeConfigField } from "../types";

export interface NodeInspectorProps {
  onClose?: () => void;
  className?: string;
}

export function NodeInspector({ onClose, className }: NodeInspectorProps) {
  const {
    selectedNode,
    selectedId,
    updateSelected,
    duplicateNode,
    removeNode,
    capabilities,
  } = useAutomation();

  if (!selectedNode) {
    return (
      <div className={cn("flex h-full flex-col items-center justify-center p-6 text-center", className)}>
        <Settings2 className="mb-2 size-5 text-muted-foreground" aria-hidden />
        <p className="text-xs text-muted-foreground">
          Select a step on the canvas to configure it.
        </p>
      </div>
    );
  }

  const fields: NodeConfigField[] = selectedNode.data.fields ?? [];

  return (
    <div className={cn("space-y-4 p-3", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Configure
          </p>
          <p className="text-sm font-semibold">Step details</p>
        </div>
        {onClose ? (
          <Button
            size="icon"
            variant="ghost"
            className="size-7"
            aria-label="Close inspector"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 rounded-md border border-border/60 p-2">
        <span
          className={cn(
            "grid size-7 place-items-center rounded-md",
            // reuse accent from node-icons
            "bg-muted text-muted-foreground",
          )}
        >
          <Settings2 className="size-3.5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{selectedNode.data.title}</p>
          <p className="text-[11px] capitalize text-muted-foreground">
            {selectedNode.data.kind} step
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="space-y-1">
          <span className="text-xs font-medium">Name</span>
          <Input
            value={selectedNode.data.title}
            onChange={(e) => updateSelected({ title: e.target.value })}
            disabled={!capabilities.canEdit}
          />
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium">Description</span>
          <Textarea
            rows={3}
            value={selectedNode.data.description ?? ""}
            onChange={(e) => updateSelected({ description: e.target.value })}
            disabled={!capabilities.canEdit}
          />
        </label>

        {fields.map((f) => (
          <FieldEditor
            key={f.key}
            field={f}
            value={f.value}
            onChange={() => {
              // Domain-specific behaviour: caller passes fields with value already set
              // and handles persistence via onChange below.
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5"
          onClick={() => selectedId && duplicateNode(selectedId)}
          disabled={!capabilities.canEdit}
        >
          <Copy className="size-3.5" /> Duplicate
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-destructive hover:text-destructive"
          onClick={() => selectedId && removeNode(selectedId)}
          disabled={!capabilities.canDelete}
        >
          <Trash2 className="size-3.5" /> Delete
        </Button>
      </div>
    </div>
  );
}
