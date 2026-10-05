// components/documents/studio/drafting-studio.tsx
"use client";

import * as React from "react";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
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
    <div className="flex h-full min-h-0 flex-col">
      {toolbar ? (
        <div className="border-b border-border/60 p-2">{toolbar}</div>
      ) : null}

      <div className="hidden min-h-0 flex-1 lg:block">
        <ResizablePanelGroup direction="horizontal">
          {outline ? (
            <>
              <ResizablePanel defaultSize={22} minSize={16} maxSize={32}>
                <div className="h-full overflow-y-auto border-r border-border/60 p-3">
                  {outline}
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle />
            </>
          ) : null}
          <ResizablePanel defaultSize={aiPanel ? 53 : 78} minSize={40}>
            <div className="h-full overflow-y-auto p-6">{editor}</div>
          </ResizablePanel>
          {aiPanel ? (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={25} minSize={18} maxSize={40}>
                <div className="h-full overflow-y-auto border-l border-border/60 p-3">
                  {aiPanel}
                </div>
              </ResizablePanel>
            </>
          ) : null}
        </ResizablePanelGroup>
      </div>

      <div className="relative min-h-0 flex-1 lg:hidden">
        <div className="h-full overflow-y-auto p-4">{editor}</div>
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
            <SheetContent side="bottom" className="h-[70vh] overflow-y-auto p-4">
              {aiPanel}
            </SheetContent>
          </Sheet>
        ) : null}
      </div>
    </div>
  );
}
