"use client";
import * as React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ContractObligation } from "../types";
import { ObligationCard } from "./obligation-card";

export function ObligationsList({ obligations, onSelect }: { obligations: ContractObligation[]; onSelect?: (o: ContractObligation) => void }) {
  const pending = obligations.filter((o) => o.status === "pending" || o.status === "in-progress");
  const overdue = obligations.filter((o) => o.status === "overdue");
  const met = obligations.filter((o) => o.status === "met" || o.status === "waived");
  return (
    <Tabs defaultValue="pending">
      <TabsList>
        <TabsTrigger value="pending">Pending ({pending.length})</TabsTrigger>
        <TabsTrigger value="overdue">Overdue ({overdue.length})</TabsTrigger>
        <TabsTrigger value="met">Met ({met.length})</TabsTrigger>
      </TabsList>
      <TabsContent value="pending" className="mt-3 space-y-2">{pending.length === 0 ? <p className="text-sm text-muted-foreground">No pending obligations.</p> : pending.map((o) => <ObligationCard key={o.id} obligation={o} onSelect={onSelect} />)}</TabsContent>
      <TabsContent value="overdue" className="mt-3 space-y-2">{overdue.length === 0 ? <p className="text-sm text-muted-foreground">Nothing overdue.</p> : overdue.map((o) => <ObligationCard key={o.id} obligation={o} onSelect={onSelect} />)}</TabsContent>
      <TabsContent value="met" className="mt-3 space-y-2">{met.length === 0 ? <p className="text-sm text-muted-foreground">Nothing completed yet.</p> : met.map((o) => <ObligationCard key={o.id} obligation={o} onSelect={onSelect} />)}</TabsContent>
    </Tabs>
  );
}
