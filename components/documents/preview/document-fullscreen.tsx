"use client";
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface DocumentFullscreenProps { open: boolean; onOpenChange: (o: boolean) => void; title?: string; children: React.ReactNode; }

export function DocumentFullscreen({ open, onOpenChange, title, children }: DocumentFullscreenProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] p-0 [&>button]:hidden">
        <div className="flex items-center justify-between border-b border-border/60 px-4 py-2">
          <p className="truncate text-sm font-medium">{title}</p>
          <Button size="icon" variant="ghost" className="size-7" aria-label="Close fullscreen" onClick={() => onOpenChange(false)}><X className="size-4" /></Button>
        </div>
        <div className="h-[85vh] overflow-auto">{children}</div>
      </DialogContent>
    </Dialog>
  );
}
