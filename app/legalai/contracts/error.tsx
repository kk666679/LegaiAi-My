"use client";
import { ContractError } from "@/components/contracts";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="p-6"><ContractError description={error.message} onRetry={reset} /></div>;
}
