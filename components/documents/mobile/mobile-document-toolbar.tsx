"use client";
import * as React from "react";
import { Search, SlidersHorizontal, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DocumentSearchBar } from "../search/document-search-bar";

export function MobileDocumentToolbar({ onFilters, onMenu }: { onFilters?: () => void; onMenu?: () => void }) {
  return (
    <div className="flex items-center gap-2 p-2">
      <DocumentSearchBar className="min-w-0 flex-1" />
      {onFilters ? <Button size="icon" variant="outline" className="size-9" aria-label="Filters" onClick={onFilters}><SlidersHorizontal className="size-4" /></Button> : null}
      {onMenu ? <Button size="icon" variant="outline" className="size-9" aria-label="Menu" onClick={onMenu}><MoreHorizontal className="size-4" /></Button> : null}
    </div>
  );
}
