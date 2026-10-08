"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Swords, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpcReact } from "@/clients";

interface DebateDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit: (data: { problem: string; citations: string[]; rounds: number }) => Promise<void>;
}

export function DebateDialog({
  trigger,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSubmit,
}: DebateDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = (value: boolean) => {
    controlledOnOpenChange?.(value);
    if (controlledOpen === undefined) setInternalOpen(value);
  };
  const [problem, setProblem] = useState("");
  const [citations, setCitations] = useState("");
  const [rounds, setRounds] = useState(3);
  const startDebate = trpcReact.debate.start.useMutation();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!problem.trim() || problem.trim().length < 10) return;

    try {
      await onSubmit({
        problem: problem.trim(),
        citations: citations
          .split("\n")
          .map((c) => c.trim())
          .filter((c) => c.length > 0),
        rounds,
      });
      setProblem("");
      setCitations("");
      setRounds(3);
      setOpen(false);
      toast.success("Debate started");
    } catch (error) {
      toast.error("Could not start debate", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button className="gap-2">
            <Plus className="size-4" /> New debate
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Swords className="size-4 text-primary" /> Start new debate
          </SheetTitle>
          <SheetDescription>
            Run a multi-agent adversarial simulation with Plaintiff, Defendant, and Adjudicator roles.
          </SheetDescription>
        </SheetHeader>
        <form
          id="create-debate-form"
          onSubmit={submit}
          className="flex-1 space-y-4 overflow-y-auto p-4"
        >
          <div className="space-y-1">
            <Label htmlFor="debate-problem" className="text-xs">
              Legal question / problem *
            </Label>
            <Textarea
              id="debate-problem"
              value={problem}
              onChange={(event) => setProblem(event.target.value)}
              placeholder="e.g. Can an employer terminate an employee without notice during probation under Malaysian law?"
              minLength={10}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="debate-citations" className="text-xs">
              Citations (optional, one per line)
            </Label>
            <Textarea
              id="debate-citations"
              value={citations}
              onChange={(event) => setCitations(event.target.value)}
              placeholder="e.g. Employment Act 1955, s.12(1)
Industrial Relations Act 1967, s.20
[2018] 2 MLJ 456"
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Rounds</Label>
            <Input
              type="number"
              value={rounds}
              onChange={(event) => setRounds(Math.min(10, Math.max(1, Number(event.target.value) || 1)))}
              min="1"
              max="10"
              className="w-[80px]"
            />
          </div>

          {startDebate.isError ? (
            <Alert variant="destructive">
              <AlertDescription>
                Could not start debate: {startDebate.error.message}
              </AlertDescription>
            </Alert>
          ) : null}
        </form>
        <SheetFooter className="border-t p-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            type="button"
            disabled={startDebate.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="create-debate-form"
            disabled={
              startDebate.isPending ||
              !problem.trim() ||
              problem.trim().length < 10
            }
            className="gap-2"
          >
            {startDebate.isPending && (
              <Loader2 className="size-3.5 animate-spin" />
            )}
            Start debate
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}