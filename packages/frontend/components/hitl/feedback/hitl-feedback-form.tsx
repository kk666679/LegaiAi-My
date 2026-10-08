// components/hitl/feedback/hitl-feedback-form.tsx
"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { HITLFeedback } from "../types";

export interface HITLFeedbackFormProps {
  initial?: Partial<HITLFeedback>;
  onSubmit?: (fb: {
    score: 1 | 2 | 3 | 4 | 5;
    category?: HITLFeedback["category"];
    notes?: string;
    correctedOutput?: string;
    usedForTraining?: boolean;
  }) => void;
}

const CATEGORIES: NonNullable<HITLFeedback["category"]>[] = [
  "accuracy",
  "completeness",
  "tone",
  "compliance",
  "usefulness",
  "other",
];

export function HITLFeedbackForm({ initial, onSubmit }: HITLFeedbackFormProps) {
  const [score, setScore] = React.useState<number>(initial?.score ?? 0);
  const [category, setCategory] = React.useState<HITLFeedback["category"]>(initial?.category);
  const [notes, setNotes] = React.useState(initial?.notes ?? "");
  const [correctedOutput, setCorrectedOutput] = React.useState(initial?.correctedOutput ?? "");
  const [useForTraining, setUseForTraining] = React.useState(initial?.usedForTraining ?? false);

  return (
    <Card className="space-y-3 p-4">
      <p className="text-sm font-medium">Provide feedback on the AI output</p>

      <div>
        <Label className="text-xs">Score</Label>
        <div className="mt-1 flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              aria-label={`${n} stars`}
              onClick={() => setScore(n)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-5 transition-colors",
                  score >= n ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs">Category</Label>
        <div className="mt-1 flex flex-wrap gap-1">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] capitalize",
                category === c
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/60 text-muted-foreground hover:border-primary/50",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="fb-notes" className="text-xs">
          Notes
        </Label>
        <Textarea
          id="fb-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="What went wrong or right?"
        />
      </div>

      <div>
        <Label htmlFor="fb-corrected" className="text-xs">
          Corrected output (optional)
        </Label>
        <Textarea
          id="fb-corrected"
          rows={3}
          value={correctedOutput}
          onChange={(e) => setCorrectedOutput(e.target.value)}
          placeholder="Paste the corrected answer to help the model improve…"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={useForTraining}
          onChange={(e) => setUseForTraining(e.target.checked)}
          className="size-3.5"
        />
        Allow this feedback to be used for training
      </label>

      <Button
        size="sm"
        disabled={score === 0}
        onClick={() =>
          onSubmit?.({
            score: score as 1 | 2 | 3 | 4 | 5,
            category,
            notes: notes || undefined,
            correctedOutput: correctedOutput || undefined,
            usedForTraining: useForTraining,
          })
        }
      >
        Submit feedback
      </Button>
    </Card>
  );
}