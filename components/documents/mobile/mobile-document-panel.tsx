"use client";
import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PanelRight } from "lucide-react";

export function MobileDocumentPanel({ trigger, title, children }: { trigger?: React.ReactNode; title?: string; children: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? <Button size="icon" variant="outline" className="size-9" aria-label="Open panel"><PanelRight className="size-4" /></Button>}
      </SheetTrigger>
      <SheetContent side="right" className="w-80 overflow-y-auto p-4">
        {title ? <p className="mb-3 text-sm font-medium">{title}</p> : null}
        {children}
      </SheetContent>
    </Sheet>
  );
}
