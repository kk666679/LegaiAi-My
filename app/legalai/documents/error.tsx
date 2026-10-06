"use client";
import { DocumentError } from "@/components/documents";
import { LawMateMark } from "@/components/navigation/Logo";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 p-6">
      <LawMateMark size="md" className="text-muted-foreground/40" aria-hidden="true" />
      <div className="w-full"><DocumentError description={error.message} onRetry={reset} /></div>
    </div>
  );
}
