"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { PlaybookRule } from "../types";
import { CLAUSE_CATEGORY_LABELS } from "../clauses/clause-categories";

export function PlaybookEditor({ rule, onChange }: { rule: PlaybookRule; onChange?: (patch: Partial<PlaybookRule>) => void }) {
  const set = (patch: Partial<PlaybookRule>) => onChange?.(patch);
  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">{CLAUSE_CATEGORY_LABELS[rule.clauseCategory]}</p>
      {(["preferred", "acceptable", "fallback", "walkAway"] as const).map((k) => (
        <div key={k}>
          <Label htmlFor={`pb-${k}`} className="capitalize">{k === "walkAway" ? "Walk-away" : k}</Label>
          <Textarea id={`pb-${k}`} rows={2} value={rule[k]} onChange={(e) => set({ [k]: e.target.value } as Partial<PlaybookRule>)} />
        </div>
      ))}
      <div>
        <Label htmlFor="pb-rationale">Rationale</Label>
        <Input id="pb-rationale" value={rule.rationale ?? ""} onChange={(e) => set({ rationale: e.target.value })} />
      </div>
      <div>
        <Label htmlFor="pb-escalation">Escalation policy</Label>
        <Input id="pb-escalation" value={rule.escalationPolicy ?? ""} onChange={(e) => set({ escalationPolicy: e.target.value })} />
      </div>
    </Card>
  );
}
