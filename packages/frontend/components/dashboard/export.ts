/**
 * Artifact export helpers.
 *
 * Pure text transformations plus one browser download helper. Keeping them out
 * of the card component means the conversion logic is unit-testable and can be
 * reused by "export all" affordances elsewhere in the workspace.
 *
 * Nothing here touches the network or the database — export is a client-side
 * serialisation of content the caller already holds.
 */

import type { DocumentArtifact } from "@/components/dashboard/types";
import { ARTIFACT_TYPE_LABELS } from "@/components/dashboard/types";

/** Filesystem-safe slug for a download filename. */
export function toFileSlug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "artifact"
  );
}

/** `<title> — <type> — LawMate` header block prepended to every export. */
export function artifactHeader(artifact: DocumentArtifact): string {
  return [
    artifact.title,
    `Type: ${ARTIFACT_TYPE_LABELS[artifact.type]}`,
    `Generated: ${artifact.generatedAt}`,
    ...(artifact.sourceDocuments?.length
      ? [
          `Sources: ${artifact.sourceDocuments
            .map((document) => document.title)
            .join(", ")}`,
        ]
      : []),
  ].join("\n");
}

/** Plain-text export with a provenance header. */
export function toPlainText(artifact: DocumentArtifact): string {
  return `${artifactHeader(artifact)}\n${"-".repeat(40)}\n\n${artifact.content}\n`;
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

/**
 * Minimal HTML export.
 *
 * Deliberately not a full Markdown renderer: the body is treated as plain text
 * inside a `<pre>`, which preserves legal formatting exactly instead of
 * guessing at headings and emphasis.
 */
export function toHtml(artifact: DocumentArtifact): string {
  return [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8">',
    `<title>${escapeHtml(artifact.title)}</title>`,
    '<style>body{font-family:system-ui,sans-serif;max-width:48rem;margin:2rem auto;padding:0 1rem}pre{white-space:pre-wrap;line-height:1.6}header{color:#555;font-size:.875rem;border-bottom:1px solid #ddd;padding-bottom:.75rem}</style>',
    "</head><body>",
    `<header><pre>${escapeHtml(artifactHeader(artifact))}</pre></header>`,
    `<pre>${escapeHtml(artifact.content)}</pre>`,
    "</body></html>",
  ].join("\n");
}

const MIME_BY_FORMAT: Record<NonNullable<DocumentArtifact["format"]>, string> = {
  markdown: "text/markdown",
  text: "text/plain",
  html: "text/html",
  pdf: "text/plain",
  docx: "text/plain",
};

const EXTENSION_BY_FORMAT: Record<NonNullable<DocumentArtifact["format"]>, string> = {
  markdown: "md",
  text: "txt",
  html: "html",
  // Binary formats are produced server-side; the browser fallback is text.
  pdf: "txt",
  docx: "txt",
};

/**
 * Trigger a browser download for the artifact.
 *
 * Returns `false` when the environment cannot do it (SSR, no `document`), so
 * callers can fall back to another action instead of silently doing nothing.
 */
export function downloadArtifact(
  artifact: DocumentArtifact,
  formatOverride?: DocumentArtifact["format"],
): boolean {
  if (typeof document === "undefined" || typeof URL.createObjectURL !== "function") {
    return false;
  }

  const requested = formatOverride ?? artifact.format ?? "markdown";
  const content = requested === "html" ? toHtml(artifact) : toPlainText(artifact);
  const blob = new Blob([content], { type: `${MIME_BY_FORMAT[requested]};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${toFileSlug(artifact.title)}.${EXTENSION_BY_FORMAT[requested]}`;
  anchor.rel = "noreferrer";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
}