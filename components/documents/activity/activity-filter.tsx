"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import type { DocumentActivityEvent } from "../types";

const KINDS: DocumentActivityEvent["kind"][] = ["created", "uploaded", "viewed", "edited", "analysed", "commented", "shared", "reviewed", "approved", "exported", "archived"];

export function ActivityFilter({ value, onChange }: { value?: DocumentActivityEvent["kind"][]; onChange?: (v: DocumentActivityEvent["kind"][]) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {KINDS.map((k) => {
        const active = value?.includes(k);
        return <Button key={k} size="sm" variant={active ? "secondary" : "outline"} className="h-6 px-2 text-[11px] capitalize"
          onClick={() => { const next = new Set(value ?? []); next.has(k) ? next.delete(k) : next.add(k); onChange?.([...next]); }}>{k}</Button>;
      })}
    </div>
  );
}
