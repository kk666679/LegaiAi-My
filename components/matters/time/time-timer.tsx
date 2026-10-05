// components/matters/time/time-timer.tsx
"use client";

import * as React from "react";
import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface TimeTimerProps {
  matterId: string;
  onSave?: (entry: { description: string; durationMinutes: number }) => void;
  className?: string;
}

export function TimeTimer({ onSave, className }: TimeTimerProps) {
  const [description, setDescription] = React.useState("");
  const [seconds, setSeconds] = React.useState(0);
  const [running, setRunning] = React.useState(false);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  const formatted = `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const reset = () => {
    setRunning(false);
    setSeconds(0);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-md border border-border/60 bg-card p-2", className)}>
      <Input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What are you working on?"
        className="min-w-0 flex-1"
      />
      <span className="font-mono text-sm tabular-nums" aria-live="polite">
        {formatted}
      </span>
      {running ? (
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => setRunning(false)}>
          <Pause className="size-3.5" /> Pause
        </Button>
      ) : (
        <Button size="sm" className="gap-1.5" onClick={() => setRunning(true)}>
          <Play className="size-3.5" /> Start
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5"
        disabled={seconds === 0}
        onClick={() => {
          onSave?.({ description, durationMinutes: Math.max(1, Math.round(seconds / 60)) });
          reset();
        }}
      >
        <Square className="size-3.5" /> Save
      </Button>
    </div>
  );
}
