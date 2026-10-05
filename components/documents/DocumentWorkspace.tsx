"use client";

import { useState, type ReactNode } from "react";
import { PanelRightClose, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

/**
 * Shared workspace layout for document-centric pages (§14).
 *
 * One abstraction, three consumers: document detail, document analysis and
 * contract detail all render `main` + a contextual panel instead of each
 * inventing an incompatible split layout.
 *
 *   Desktop  → resizable side-by-side split (drag the handle).
 *   Tablet   → panel is collapsible but stays docked.
 *   Mobile   → panel moves into a Sheet, so the primary task keeps the
 *              viewport and the app never scrolls horizontally.
 *
 * Deliberately not a second app shell: the global chrome (sidebar, top bar,
 * breadcrumbs, mobile bottom nav) remains owned by `DashboardShell`.
 */

export function DocumentWorkspace({
  /** Workspace toolbar: title, back link and document actions. */
  header,
  /** Primary region — document preview, editor or analysis output. */
  children,
  /** Contextual panel content: AI assistant, metadata, insights, sources. */
  panel,
  /** Label for the contextual panel; also used as the mobile sheet title. */
  panelTitle = "Assistant",
  /** Accessible name for the whole region. */
  label = "Document workspace",
  /** Render the contextual panel at all (a page may hide it entirely). */
  hasPanel = true,
  /** Default docked width on large screens, in percent of the split. */
  defaultPanelSize = 34,
  className,
}: {
  header?: ReactNode;
  children: ReactNode;
  panel?: ReactNode;
  panelTitle?: string;
  label?: string;
  hasPanel?: boolean;
  defaultPanelSize?: number;
  className?: string;
}) {
  const [panelOpen, setPanelOpen] = useState(true);

  if (!hasPanel || !panel) {
    // No contextual content — render the single-region layout.
    return (
      <section aria-label={label} className={cn("flex min-w-0 flex-col", className)}>
        {header}
        <div className="min-w-0 flex-1">{children}</div>
      </section>
    );
  }

  return (
    <section aria-label={label} className={cn("flex min-w-0 flex-col", className)}>
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex min-w-0 items-center gap-2 border-b pb-2">
        <div className="min-w-0 flex-1">{header}</div>

        {/* Mobile: contextual panel lives in a Sheet */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 gap-1.5 lg:hidden"
            >
              <Sparkles className="size-4" aria-hidden />
              {panelTitle}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <SheetTitle className="border-b px-4 py-3 text-sm font-semibold">
              {panelTitle}
            </SheetTitle>
            <ScrollArea className="min-h-0 flex-1">{panel}</ScrollArea>
          </SheetContent>
        </Sheet>

        {/* Desktop/tablet: dock toggle */}
        <Button
          variant="outline"
          size="sm"
          className="hidden shrink-0 gap-1.5 lg:inline-flex"
          onClick={() => setPanelOpen((v) => !v)}
          aria-expanded={panelOpen}
        >
          <PanelRightClose
            className={cn("size-4 transition-transform", !panelOpen && "rotate-180")}
            aria-hidden
          />
          {panelTitle}
        </Button>
      </div>

      {/* ── Main + contextual panel ──────────────────────────── */}
      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 min-w-0 flex-1"
      >
        <ResizablePanel defaultSize={`${100 - defaultPanelSize}%`} minSize="40%">
          <div className="min-w-0 overflow-x-hidden">{children}</div>
        </ResizablePanel>

        {panelOpen && (
          <>
            <ResizableHandle withHandle className="mx-1 hidden lg:flex" />
            <ResizablePanel
              defaultSize={`${defaultPanelSize}%`}
              minSize="20%"
              className="hidden lg:block"
            >
              <div className="h-full min-w-0">{panel}</div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </section>
  );
}