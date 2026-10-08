"use client";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";

export function DocumentType({ type, className }: { type: string; className?: string }) {
  return <Badge variant="outline" className={className}><FileText className="mr-1 size-3" />{type}</Badge>;
}
