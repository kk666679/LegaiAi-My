"use client";
import * as React from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DocumentDownload({ url, fileName, label = "Download", className }: { url: string; fileName?: string; label?: string; className?: string }) {
  return (
    <Button asChild variant="outline" size="sm" className={className}>
      <a href={url} download={fileName}><Download className="mr-1.5 size-3.5" />{label}</a>
    </Button>
  );
}
