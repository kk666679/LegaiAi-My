"use client";
import * as React from "react";
import { Download, FileText, FileType, FileJson } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type ExportFormat = "pdf" | "docx" | "txt" | "md" | "json";
export interface DocumentExportProps { onExport: (format: ExportFormat) => void; className?: string; }

export function DocumentExport({ onExport, className }: DocumentExportProps) {
  const options: Array<{ fmt: ExportFormat; label: string; icon: React.ReactNode }> = [
    { fmt: "pdf", label: "PDF", icon: <FileText className="size-3.5" /> },
    { fmt: "docx", label: "DOCX", icon: <FileType className="size-3.5" /> },
    { fmt: "md", label: "Markdown", icon: <FileText className="size-3.5" /> },
    { fmt: "txt", label: "Plain text", icon: <FileText className="size-3.5" /> },
    { fmt: "json", label: "JSON", icon: <FileJson className="size-3.5" /> },
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" className={className}><Download className="mr-1.5 size-3.5" />Export</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Export format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {options.map((o) => <DropdownMenuItem key={o.fmt} onClick={() => onExport(o.fmt)} className="gap-2">{o.icon}{o.label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
