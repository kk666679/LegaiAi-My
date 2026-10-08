"use client";
import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ContractSearchBar({ value, onChange, placeholder = "Search contracts, clauses, counterparties…", className }: { value?: string; onChange?: (v: string) => void; placeholder?: string; className?: string }) {
  const [local, setLocal] = React.useState(value ?? "");
  React.useEffect(() => setLocal(value ?? ""), [value]);
  return (
    <div className={cn("relative w-full", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={local} placeholder={placeholder} aria-label="Search contracts" onChange={(e) => { setLocal(e.target.value); onChange?.(e.target.value); }} className="pl-9 pr-9" />
      {local ? <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 size-7 -translate-y-1/2" aria-label="Clear" onClick={() => { setLocal(""); onChange?.(""); }}><X className="size-4" /></Button> : null}
    </div>
  );
}
