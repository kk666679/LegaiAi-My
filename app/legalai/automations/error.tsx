// app/automations/error.tsx
"use client";
import { AutomationError } from "@/components/automation";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-6">
      <AutomationError description={error.message} onRetry={reset} />
    </div>
  );
}
