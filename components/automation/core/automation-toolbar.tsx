// components/automation/core/automation-toolbar.tsx
"use client";

import * as React from "react";
import {
  Activity,
  Download,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Play,
  RefreshCw,
  Sparkles,
  Sun,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface AutomationToolbarProps {
  onTest?: () => void;
  onReset?: () => void;
  onExport?: () => void;
  onImport?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleAI?: () => void;
  onToggleTheme?: () => void;
  onTogglePalette?: () => void;
  onToggleInspector?: () => void;
  onToggleLog?: () => void;
  aiOpen?: boolean;
  dark?: boolean;
  paletteOpen?: boolean;
  inspectorOpen?: boolean;
  logOpen?: boolean;
  running?: boolean;
  className?: string;
}

export function AutomationToolbar({
  onTest,
  onReset,
  onExport,
  onImport,
  onToggleAI,
  onToggleTheme,
  onTogglePalette,
  onToggleInspector,
  onToggleLog,
  aiOpen,
  dark,
  paletteOpen,
  inspectorOpen,
  logOpen,
  running,
  className,
}: AutomationToolbarProps) {
  const fileRef = React.useRef<HTMLInputElement>(null);

  return (
    <div
      role="toolbar"
      aria-label="Automation toolbar"
      className={cn("flex flex-wrap items-center gap-2", className)}
    >
      <div className="flex items-center gap-2">
        <Button size="sm" className="gap-1.5" onClick={onTest} disabled={running}>
          <Play className="size-3.5" fill="currentColor" />
          {running ? "Running…" : "Test run"}
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onReset}>
          <RefreshCw className="size-3.5" /> Reset
        </Button>
      </div>

      <Separator orientation="vertical" className="h-5" />

      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" className="gap-1.5" onClick={onExport}>
          <Download className="size-3.5" /> Export
        </Button>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => fileRef.current?.click()}>
          <Upload className="size-3.5" /> Import
        </Button>
        <input ref={fileRef} type="file" accept="application/json" hidden onChange={onImport} />
      </div>

      <div className="ml-auto flex items-center gap-1.5">
        <Button
          size="sm"
          variant={aiOpen ? "secondary" : "outline"}
          className="gap-1.5"
          onClick={onToggleAI}
        >
          <Sparkles className="size-3.5" /> AI
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Toggle theme"
          onClick={onToggleTheme}
        >
          {dark ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Toggle palette"
          onClick={onTogglePalette}
        >
          {paletteOpen ? <PanelLeftClose className="size-4" /> : <PanelLeftOpen className="size-4" />}
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          aria-label="Toggle inspector"
          onClick={onToggleInspector}
        >
          {inspectorOpen ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
        </Button>
        <Button
          size="icon"
          variant={logOpen ? "secondary" : "ghost"}
          className="size-8"
          aria-label="Toggle event log"
          onClick={onToggleLog}
        >
          <Activity className="size-4" />
        </Button>
      </div>
    </div>
  );
}
