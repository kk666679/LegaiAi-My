"use client";
import * as React from "react";
import { Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegalDocument } from "../types";

export function DocumentArchive({ document, onArchive }: { document: LegalDocument; onArchive?: (doc: LegalDocument) => void }) {
  return <Button size="sm" variant="ghost" onClick={() => onArchive?.(document)}><Archive className="mr-1.5 size-3.5" />Archive</Button>;
}
