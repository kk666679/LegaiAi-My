// components/documents/studio/drafting-studio.tsx
"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export interface DraftingStudioProps {
  outline?: React.ReactNode;
  editor: React.ReactNode;
  aiPanel?: React.ReactNode;
  toolbar?: React.ReactNode;
  mobileAiOpen?: boolean;
  onMobileAiOpenChange?: (open: boolean) => void;
}

export function DraftingStudio({
  outline,
  editor,
  aiPanel,
  toolbar,
  mobileAiOpen,
  onMobileAiOpenChange,
}: DraftingStudioProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      {toolbar ? (
        <div className="shrink-0 border-b border-border/60 bg-background/95 p-3">{toolbar}</div>
      ) : null}

      <div className="hidden min-h-0 min-w-0 flex-1 xl:grid xl:grid-cols-[minmax(13rem,0.78fr)_minmax(0,2.2fr)_minmax(16rem,0.92fr)]">
        {outline ? (
          <aside className="min-h-0 min-w-0 overflow-y-auto border-r border-border/60 p-4">
            {outline}
          </aside>
        ) : null}
        <main className="min-h-0 min-w-0 overflow-y-auto bg-muted/20 p-5 2xl:p-8">{editor}</main>
        {aiPanel ? (
          <aside className="min-h-0 min-w-0 overflow-y-auto border-l border-border/60 p-4">
            {aiPanel}
          </aside>
        ) : null}
      </div>

      <div className="relative min-h-0 min-w-0 flex-1 xl:hidden">
        <div className="h-full overflow-y-auto bg-muted/20 p-4 md:p-6">{editor}</div>
        {aiPanel ? (
          <Sheet open={mobileAiOpen} onOpenChange={onMobileAiOpenChange}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                className="absolute bottom-4 right-4 z-10 size-11 rounded-full shadow-lg"
                aria-label="Open AI assistant"
              >
                <Sparkles className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[78dvh] overflow-y-auto p-4">
              {aiPanel}
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </div>
  );
}
