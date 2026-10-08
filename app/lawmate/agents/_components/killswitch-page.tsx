"use client";
// app/lawmate/agents/_components/killswitch-page.tsx
import * as React from "react";
import { AlertTriangle, RotateCcw, Skull } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAgents } from "./use-agents";
import { AgentStatusBadge, AgentTierBadge } from "./agent-status-badge";
import { toast } from "sonner";

export function KillSwitchPage() {
  const { agents, kill, revive } = useAgents({ scope: "all" });

  const killAll = () => {
    agents.forEach((a) => kill(a.id));
    toast.error("All agents disabled");
  };
  const reviveAll = () => {
    agents.forEach((a) => revive(a.id));
    toast.success("All agents revived");
  };

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Kill switch</h1>
        <p className="text-xs text-muted-foreground">Immediate shutdown controls for the entire fleet.</p>
      </header>
      <div className="space-y-4 p-4">
        <Card className="border-destructive/40 bg-destructive/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-destructive">Emergency controls</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Killing an agent immediately stops new runs and cancels in-flight ones. Revive restores normal operation.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive" className="gap-1.5">
                      <Skull className="size-3.5" /> Kill all agents
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Kill all agents?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Every agent will stop immediately and pending runs will be cancelled. You can revive them individually at any time.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={killAll}>
                        Kill all
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button size="sm" variant="outline" className="gap-1.5" onClick={reviveAll}>
                  <RotateCcw className="size-3.5" /> Revive all
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          {agents.map((a) => (
            <Card key={a.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <AgentTierBadge tier={a.tier} />
                  <AgentStatusBadge status={a.status} compact />
                </div>
              </div>
              {a.killed ? (
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => { revive(a.id); toast.success("Revived"); }}>
                  <RotateCcw className="size-3.5" /> Revive
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => { kill(a.id); toast.error("Killed"); }}>
                  <Skull className="size-3.5" /> Kill
                </Button>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
