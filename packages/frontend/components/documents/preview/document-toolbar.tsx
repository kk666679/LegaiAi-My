// components/documents/preview/document-toolbar.tsx
"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Printer,
  Search,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export interface DocumentToolbarProps {
  page?: number;
  pageCount?: number;
  zoom?: number;
  onPageChange?: (page: number) => void;
  onZoomChange?: (zoom: number) => void;
  onFullscreen?: () => void;
  onDownload?: () => void;
  onPrint?: () => void;
  onSearch?: () => void;
}

export function DocumentToolbar({
  page = 1,
  pageCount,
  zoom = 1,
  onPageChange,
  onZoomChange,
  onFullscreen,
  onDownload,
  onPrint,
  onSearch,
}: DocumentToolbarProps) {
  return (
    <div
      role="toolbar"
      aria-label="Document controls"
      className="flex items-center gap-1 rounded-md border border-border/60 bg-card px-1.5 py-1"
    >
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Previous page"
        disabled={page <= 1}
        onClick={() => onPageChange?.(page - 1)}
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="min-w-12 text-center text-xs tabular-nums text-muted-foreground">
        {page}
        {pageCount ? ` / ${pageCount}` : ""}
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Next page"
        disabled={pageCount ? page >= pageCount : false}
        onClick={() => onPageChange?.(page + 1)}
      >
        <ChevronRight className="size-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-4" />
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Zoom out"
        onClick={() => onZoomChange?.(Math.max(0.25, zoom - 0.1))}
      >
        <ZoomOut className="size-4" />
      </Button>
      <span className="w-10 text-center text-xs tabular-nums text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Zoom in"
        onClick={() => onZoomChange?.(Math.min(3, zoom + 0.1))}
      >
        <ZoomIn className="size-4" />
      </Button>
      <Separator orientation="vertical" className="mx-1 h-4" />
      <Button size="icon" variant="ghost" className="size-7" aria-label="Search" onClick={onSearch}>
        <Search className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Print" onClick={onPrint}>
        <Printer className="size-4" />
      </Button>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Download" onClick={onDownload}>
        <Download className="size-4" />
      </Button>
      <Button
        size="icon"
        variant="ghost"
        className="size-7"
        aria-label="Fullscreen"
        onClick={onFullscreen}
      >
        <Maximize2 className="size-4" />
      </Button>
    </div>
  );
}
