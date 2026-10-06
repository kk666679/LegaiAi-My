"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Search, ShieldCheck } from "lucide-react";
import { MatterConflicts, type MatterConflict } from "@/components/matters";
import { toast } from "sonner";

export function ConflictsPage() {
  const [query, setQuery] = React.useState("");
  const [conflicts, setConflicts] = React.useState<MatterConflict[]>([]);
  const [running, setRunning] = React.useState(false);

  const run = async () => {
    if (!query.trim()) { toast.error("Enter a name to check"); return; }
    setRunning(true);
    // POST /api/matters/conflicts/check { query }
    setTimeout(() => {
      setConflicts((prev) => [{ id: `c-${Date.now()}`, query, severity: "none", matches: [] }, ...prev]);
      setRunning(false);
      setQuery("");
    }, 800);
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Conflict checks</h1>
        <p className="text-xs text-muted-foreground">Search existing matters, clients, and counterparties.</p>
      </header>
      <div className="mx-auto w-full max-w-3xl space-y-4 p-4">
        <Card className="space-y-3 p-4">
          <div className="flex gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") run(); }} placeholder="Search by name…" className="pl-9" aria-label="Search for conflicts" />
            </div>
            <Button disabled={running} onClick={run}>{running ? "Checking…" : "Run check"}</Button>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1"><ShieldCheck className="size-3" />Clears against matters, clients, and counterparties</span>
          </div>
        </Card>
        {conflicts.length === 0 ? <p className="text-sm text-muted-foreground">No conflict checks run yet.</p> : <MatterConflicts conflicts={conflicts} />}
      </div>
    </div>
  );
}
