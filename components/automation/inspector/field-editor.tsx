// components/automation/inspector/field-editor.tsx
"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { NodeConfigField } from "../types";

export interface FieldEditorProps {
  field: NodeConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function FieldEditor({ field, value, onChange }: FieldEditorProps) {
  const id = React.useId();

  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-xs font-medium">
        {field.label}
        {field.required ? <span className="ml-1 text-destructive">*</span> : null}
      </label>

      {field.type === "text" ? (
        <Input
          id={id}
          value={String(value ?? field.value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : field.type === "textarea" || field.type === "json" ? (
        <Textarea
          id={id}
          rows={field.type === "json" ? 6 : 3}
          value={
            field.type === "json"
              ? typeof value === "string"
                ? value
                : JSON.stringify(value ?? field.value ?? {}, null, 2)
              : String(value ?? field.value ?? "")
          }
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={field.type === "json" ? "font-mono text-xs" : undefined}
        />
      ) : field.type === "number" ? (
        <Input
          id={id}
          type="number"
          value={String(value ?? field.value ?? "")}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      ) : field.type === "boolean" ? (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox
            checked={Boolean(value ?? field.value ?? false)}
            onCheckedChange={(v) => onChange(Boolean(v))}
          />
          {field.help ?? field.label}
        </label>
      ) : field.type === "select" ? (
        <Select
          value={String(value ?? field.value ?? "")}
          onValueChange={(v) => onChange(v)}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder ?? "Select…"} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={id}
          value={String(value ?? field.value ?? "")}
          placeholder={field.placeholder ?? `${field.type}…`}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {field.help && field.type !== "boolean" ? (
        <p className="text-[11px] text-muted-foreground">{field.help}</p>
      ) : null}
    </div>
  );
}
