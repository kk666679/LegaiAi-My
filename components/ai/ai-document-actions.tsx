"use client";

import { useMemo } from "react";
import { Copy, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  ArtifactAction,
  ArtifactActions,
} from "@/components/ai-elements/artifact";

export type AIDocumentActionsProps = {
  documentText: string;
  filename?: string;
  shareTitle?: string;
  className?: string;
};

export function AIDocumentActions({
  documentText,
  filename = "document.txt",
  shareTitle = "Document",
  className,
}: AIDocumentActionsProps) {
  const safeFilename = useMemo(() => {
    // Keep filename simple and safe
    const cleaned = filename
      .replace(/\.[a-z0-9]+$/i, "")
      .replace(/[^a-z0-9\-_ ]/gi, "")
      .trim()
      .replace(/\s+/g, "-");

    return `${cleaned || "document"}.txt`;
  }, [filename]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(documentText);
  };

  const handleDownload = () => {
    const blob = new Blob([documentText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = safeFilename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    // Prefer native share if available
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navAny = navigator as any;
    if (navAny?.share) {
      await navAny.share({
        title: shareTitle,
        text: documentText,
      });
      return;
    }

    // Fallback: copy + user can paste
    await handleCopy();
  };

  if (!documentText) return null;

  return (
    <ArtifactActions className={className}>
      <ArtifactAction
        tooltip="Copy"
        label="Copy"
        icon={Copy}
        onClick={handleCopy}
        aria-label="Copy document"
      />
      <ArtifactAction
        tooltip="Download"
        label="Download"
        icon={Download}
        onClick={handleDownload}
        aria-label="Download document"
      />
      <ArtifactAction
        tooltip="Share"
        label="Share"
        icon={Share2}
        onClick={handleShare}
        aria-label="Share document"
      />

      {/* Keep a non-icon variant available for future use */}
      <div className="hidden">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button>
      </div>

      {/* also export the actions for any layout variants */}
    </ArtifactActions>
  );
}

