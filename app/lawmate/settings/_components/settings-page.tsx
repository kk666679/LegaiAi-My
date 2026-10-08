"use client";
// app/lawmate/settings/_components/settings-page.tsx
import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SettingsPageProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  footer?: {
    hint?: string;
    onSave?: () => void;
    onReset?: () => void;
    saving?: boolean;
    disabled?: boolean;
    saveLabel?: string;
  };
  children: React.ReactNode;
  className?: string;
}

export function SettingsPage({
  title,
  description,
  actions,
  footer,
  children,
  className,
}: SettingsPageProps) {
  return (
    <div className={cn("space-y-6", className)}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? (
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>

      <div className="space-y-5">{children}</div>

      {footer ? (
        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground">
            {footer.hint ?? "Changes are saved automatically."}
          </p>
          <div className="flex items-center gap-2">
            {footer.onReset ? (
              <Button variant="ghost" size="sm" onClick={footer.onReset} disabled={footer.saving}>
                Reset
              </Button>
            ) : null}
            {footer.onSave ? (
              <Button
                size="sm"
                onClick={footer.onSave}
                disabled={footer.saving || footer.disabled}
              >
                {footer.saving ? "Saving…" : footer.saveLabel ?? "Save changes"}
              </Button>
            ) : null}
          </div>
        </footer>
      ) : null}
    </div>
  );
}
