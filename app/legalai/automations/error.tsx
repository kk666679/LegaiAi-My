// app/automations/error.tsx
"use client";
import { AutomationError } from "@/components/automation";
import { LawMateMark } from "@/components/navigation/Logo";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <LawMateMark size="md" className="text-muted-foreground/40" aria-hidden="true" />
      <div className="w-full"><AutomationError description={error.message} onRetry={reset} /></div>
    </div>
  );
}
