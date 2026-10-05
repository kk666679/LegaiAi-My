"use client";
import * as React from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DocumentZoomControlsProps { zoom: number; onZoomChange: (z: number) => void; min?: number; max?: number; }

export function DocumentZoomControls({ zoom, onZoomChange, min = 0.25, max = 3 }: DocumentZoomControlsProps) {
  return (
    <div className="flex items-center gap-0.5" role="group" aria-label="Zoom controls">
      <Button size="icon" variant="ghost" className="size-7" aria-label="Zoom out" onClick={() => onZoomChange(Math.max(min, zoom - 0.1))}><ZoomOut className="size-4" /></Button>
      <button type="button" onClick={() => onZoomChange(1)} className="w-12 text-center text-xs tabular-nums text-muted-foreground hover:text-foreground" aria-label="Reset zoom">{Math.round(zoom * 100)}%</button>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Zoom in" onClick={() => onZoomChange(Math.min(max, zoom + 0.1))}><ZoomIn className="size-4" /></Button>
      <Button size="icon" variant="ghost" className="size-7" aria-label="Fit to width" onClick={() => onZoomChange(1)}><RotateCcw className="size-3.5" /></Button>
    </div>
  );
}
