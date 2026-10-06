// app/legalai/settings/layout.tsx
import * as React from "react";
import { SettingsSidebar } from "./_components/sidebar";

export const metadata = {
  title: "Settings — LegAI",
  description: "Manage your workspace, account, and preferences.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-3">
            <a href="/legalai" className="text-sm font-medium text-muted-foreground hover:text-foreground">
              ← LegAI
            </a>
            <span className="text-muted-foreground/40">/</span>
            <h1 className="text-sm font-semibold">Settings</h1>
          </div>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-6 px-4 py-6 lg:px-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <SettingsSidebar />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
