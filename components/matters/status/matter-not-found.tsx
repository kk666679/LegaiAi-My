// components/matters/status/matter-not-found.tsx
"use client";

import * as React from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface MatterNotFoundProps {
  onBack?: () => void;
}

export function MatterNotFound({ onBack }: MatterNotFoundProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <div className="rounded-full bg-muted p-3 text-muted-foreground">
        <FileQuestion className="size-6" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold">Matter not found</h3>
        <p className="text-sm text-muted-foreground">
          This matter doesn&apos;t exist or you don&apos;t have access.
        </p>
      </div>
      {onBack ? (
        <Button variant="outline" onClick={onBack}>
          Back to matters
        </Button>
      ) : null}
    </div>
  );
}
