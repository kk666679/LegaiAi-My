"use client";
import { HITLError } from "@/components/hitl";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="p-6"><HITLError description={error.message} onRetry={reset} /></div>;
}
