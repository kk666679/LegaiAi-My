"use client";
import { MatterError } from "@/components/matters";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="p-6"><MatterError description={error.message} onRetry={reset} /></div>;
}
