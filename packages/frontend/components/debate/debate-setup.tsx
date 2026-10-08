"use client";

import { useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, Swords } from "lucide-react";

export interface DebateStartInput {
  problem: string;
  citations: string[];
  rounds: number;
}

export function DebateSetup({
  onStart,
  submitting = false,
  error,
}: {
  onStart: (input: DebateStartInput) => Promise<void>;
  submitting?: boolean;
  error?: string;
}) {
  const [problem, setProblem] = useState("");
  const [citations, setCitations] = useState("");
  const [rounds, setRounds] = useState("2");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);
    if (problem.trim().length < 10) {
      setSubmitError("Enter a legal question or proposition with at least 10 characters.");
      return;
    }

    const citationList = citations.split("\n").map((citation) => citation.trim()).filter(Boolean);
    if (problem.trim().length > 10000 || citationList.length > 30 ||
        citationList.some((citation) => citation.length > 500)) {
      setSubmitError("Keep the question under 10,000 characters and provide up to 30 citations of 500 characters each.");
      return;
    }

    try {
      await onStart({
        problem: problem.trim(),
        citations: citationList,
        rounds: Number(rounds),
      });
    } catch (submitFailure) {
      setSubmitError(
        submitFailure instanceof Error
          ? submitFailure.message
          : "The debate could not be queued. Please try again.",
      );
    }
  };

  const visibleError = submitError ?? error;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Swords className="size-5 text-primary" aria-hidden />
          Set up a debate
        </CardTitle>
        <CardDescription>
          Submit a question for opposing AI arguments and an evaluative response.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="debate-problem">Legal question or proposition</Label>
            <Textarea
              id="debate-problem"
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              placeholder="State the issue to examine, including any material facts or assumptions."
              rows={5}
              required
              minLength={10}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debate-citations">Authorities to consider (optional)</Label>
            <Textarea
              id="debate-citations"
              value={citations}
              onChange={(event) => setCitations(event.target.value)}
              placeholder={"Enter one citation per line.\nThese are user-supplied and are not verified by this workflow."}
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="debate-rounds">Argument rounds</Label>
            <Select value={rounds} onValueChange={setRounds} disabled={submitting}>
              <SelectTrigger id="debate-rounds" className="w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 round</SelectItem>
                <SelectItem value="2">2 rounds</SelectItem>
                <SelectItem value="3">3 rounds</SelectItem>
                <SelectItem value="4">4 rounds</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {visibleError ? (
            <Alert variant="destructive">
              <AlertTriangle />
              <AlertTitle>Could not start debate</AlertTitle>
              <AlertDescription>{visibleError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
              Do not submit confidential or privileged material. Generated arguments
              and citations are unverified and must be checked against authoritative
              sources by a qualified lawyer.
            </p>
            <Button type="submit" disabled={submitting} className="shrink-0 gap-2">
              {submitting ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Swords className="size-4" aria-hidden />}
              {submitting ? "Queuing…" : "Start debate"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
