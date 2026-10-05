"use client";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface DocumentProperty { key: string; label: string; value?: string; editable?: boolean; }
export interface DocumentPropertiesProps { properties: DocumentProperty[]; onPropertyChange?: (key: string, value: string) => void; className?: string; }

export function DocumentProperties({ properties, onPropertyChange, className }: DocumentPropertiesProps) {
  return (
    <div className={className}>
      {properties.map((p) => (
        <div key={p.key} className="space-y-1 border-b border-border/60 py-2 last:border-0">
          <Label htmlFor={`prop-${p.key}`} className="text-xs text-muted-foreground">{p.label}</Label>
          <Input id={`prop-${p.key}`} value={p.value ?? ""} readOnly={!p.editable} onChange={(e) => onPropertyChange?.(p.key, e.target.value)} className="h-7 text-sm" />
        </div>
      ))}
    </div>
  );
}
