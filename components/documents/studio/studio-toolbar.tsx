"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export interface StudioTemplate {
  id: string;
  label: string;
}

const DOC_TYPES = [
  { value: "CONTRACT", label: "Contract" },
  { value: "BRIEF", label: "Brief" },
  { value: "MOTION", label: "Motion" },
  { value: "MEMORANDUM", label: "Memorandum" },
  { value: "PLEADING", label: "Pleading" },
  { value: "AGREEMENT", label: "Agreement" },
  { value: "LETTER", label: "Letter" },
  { value: "OTHER", label: "Other" },
];

export function StudioToolbar({
  title,
  onTitleChange,
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
  saving = false,
  lastSaved,
  saveError,
  docType,
  onDocTypeChange,
  docTypeLabel,
}: {
  title: string;
  onTitleChange?: (title: string) => void;
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
  saving?: boolean;
  lastSaved?: string | null;
  saveError?: string | null;
  docType?: string;
  onDocTypeChange?: (docType: string) => void;
  docTypeLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="mr-auto flex min-w-0 flex-col">
        <Input
          value={title}
          onChange={(event) => onTitleChange?.(event.currentTarget.value)}
          className="h-8 w-56 min-w-0 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0"
          aria-label="Document title"
          placeholder="Untitled document"
        />
        <span className="text-[11px] text-muted-foreground">
          {status ? `· ${status}` : ""}
          {saving ? " · Saving…" : lastSaved ? ` · Saved ${lastSaved}` : ""}
          {saveError ? ` · Error: ${saveError}` : ""}
        </span>
      </div>
      {onDocTypeChange && (
        <Select value={docType} onValueChange={onDocTypeChange}>
          <SelectTrigger className="w-40" aria-label="Document type">
            <SelectValue placeholder="Type">
              {docTypeLabel ?? docType}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {DOC_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
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
      {onSave && (
        <Button size="sm" variant="outline" onClick={onSave} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      )}
      {onShare && <Button size="sm" variant="outline" onClick={onShare}>Share</Button>}
      {onExport && <Button size="sm" onClick={() => onExport("PDF")}>Export PDF</Button>}
    </div>
  );
}