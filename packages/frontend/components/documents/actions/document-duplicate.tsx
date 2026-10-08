"use client";
import * as React from "react";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { LegalDocument } from "../types";

export function DocumentDuplicate({ document, onDuplicate }: { document: LegalDocument; onDuplicate?: (doc: LegalDocument) => void }) {
  return <Button size="sm" variant="ghost" onClick={() => onDuplicate?.(document)}><Copy className="mr-1.5 size-3.5" />Duplicate</Button>;
}
