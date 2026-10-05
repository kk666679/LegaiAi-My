"use client";
import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentFolder } from "../types";

export interface FolderSelectorProps { folders: DocumentFolder[]; value?: string; onChange?: (id: string) => void; placeholder?: string; }

export function FolderSelector({ folders, value, onChange, placeholder = "Select folder" }: FolderSelectorProps) {
  const flat = React.useMemo(() => {
    const out: Array<{ id: string; label: string; level: number }> = [];
    const walk = (items: DocumentFolder[], level = 0) => {
      for (const f of items) { out.push({ id: f.id, label: f.name, level }); if (f.children) walk(f.children, level + 1); }
    };
    walk(folders);
    return out;
  }, [folders]);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {flat.map((f) => <SelectItem key={f.id} value={f.id}><span style={{ paddingLeft: `${f.level * 12}px` }}>{f.label}</span></SelectItem>)}
      </SelectContent>
    </Select>
  );
}
