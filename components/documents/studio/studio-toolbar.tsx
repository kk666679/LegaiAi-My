"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface StudioTemplate {
  id: string;
  label: string;
}

export function StudioToolbar({
  title,
  status,
  templates = [],
  templateId,
  onTemplateChange,
  onSave,
  onExport,
  onShare,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: {
  title: string;
  status?: string;
  templates?: StudioTemplate[];
  templateId?: string;
  onTemplateChange?: (id: string) => void;
  onSave?: () => void;
  onExport?: (format: "PDF" | "DOCX" | "TXT" | "MD") => void;
  onShare?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-auto text-sm font-medium">{title}{status ? ` · ${status}` : ""}</span>
      {templates.length > 0 && (
        <Select value={templateId} onValueChange={onTemplateChange}>
          <SelectTrigger className="w-44" aria-label="Document template">
            <SelectValue placeholder="Choose template" />
          </SelectTrigger>
          <SelectContent>
            {templates.map((template) => (
              <SelectItem key={template.id} value={template.id}>{template.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button size="sm" variant="ghost" disabled={!canUndo} onClick={onUndo}>Undo</Button>
      <Button size="sm" variant="ghost" disabled={!canRedo} onClick={onRedo}>Redo</Button>
      {onSave && <Button size="sm" variant="outline" onClick={onSave}>Save</Button>}
      {onShare && <Button size="sm" variant="outline" onClick={onShare}>Share</Button>}
      {onExport && <Button size="sm" onClick={() => onExport("PDF")}>Export PDF</Button>}
    </div>
  );
}
