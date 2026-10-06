"use client";
import { DocumentError } from "@/components/documents";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="p-6"><DocumentError description={error.message} onRetry={reset} /></div>;
}
