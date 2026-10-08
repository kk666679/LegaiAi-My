"use client";
import * as React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import type { ContractClause, PlaybookRule } from "../types";

export interface NegotiationSuggestion { clauseId: string; clauseHeading: string; suggestion: string; ruleId?: string; }

export function ContractNegotiator({ clauses, rules, suggestions = [], onSuggestion, onApply }: { clauses?: ContractClause[]; rules?: PlaybookRule[]; suggestions?: NegotiationSuggestion[]; onSuggestion?: (clauseId: string) => void; onApply?: (s: NegotiationSuggestion) => void }) {
  void clauses; void rules;
  return (
    <div className="space-y-4">
      <Card className="flex items-center gap-2 p-3">
        <Sparkles className="size-4 text-primary" />
        <div className="min-w-0 flex-1"><p className="text-sm font-medium">AI negotiator</p><p className="text-xs text-muted-foreground">Counter-proposals drawn from your playbook.</p></div>
      </Card>
      {suggestions.length === 0 ? <p className="text-sm text-muted-foreground">No suggestions yet. Run the negotiator to generate counter-proposals.</p> : (
        <div className="space-y-2">
          {suggestions.map((s) => (
            <Card key={s.clauseId} className="space-y-2 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">{s.clauseHeading}</p>
                <Button size="sm" variant="outline" onClick={() => onSuggestion?.(s.clauseId)}>Regenerate</Button>
              </div>
              <p className="text-sm text-muted-foreground">{s.suggestion}</p>
              {onApply ? <Button size="sm" onClick={() => onApply(s)}>Apply suggestion</Button> : null}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
