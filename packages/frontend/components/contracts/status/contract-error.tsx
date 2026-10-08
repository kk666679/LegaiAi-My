"use client";
import * as React from "react";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ContractError({ title = "Couldn't load contracts", description = "Please try again.", onRetry, className }: { title?: string; description?: string; onRetry?: () => void; className?: string }) {
  return (
    <Alert variant="destructive" className={cn("flex items-start gap-3", className)}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <div className="flex-1 space-y-2">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
        {onRetry ? <Button size="sm" variant="outline" onClick={onRetry}>Try again</Button> : null}
      </div>
    </Alert>
  );
}
