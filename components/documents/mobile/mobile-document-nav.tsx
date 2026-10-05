"use client";
import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { DocumentsNavigation } from "../core/documents-navigation";

export function MobileDocumentNav({ trigger }: { trigger?: React.ReactNode }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        {trigger ?? <Button size="icon" variant="outline" className="size-9" aria-label="Navigation"><Menu className="size-4" /></Button>}
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0"><DocumentsNavigation /></SheetContent>
    </Sheet>
  );
}
