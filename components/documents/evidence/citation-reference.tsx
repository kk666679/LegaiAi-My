"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface CitationReferenceProps { index: number; title: string; href?: string; className?: string; }

export function CitationReference({ index, title, href, className }: CitationReferenceProps) {
  const content = <><sup className="text-[10px]">{index}</sup> <span>{title}</span></>;
  if (href) return <a href={href} target="_blank" rel="noreferrer" className={cn("text-primary hover:underline", className)}>{content}</a>;
  return <span className={cn("text-muted-foreground", className)}>{content}</span>;
}
