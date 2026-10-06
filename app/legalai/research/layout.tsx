// app/legalai/research/layout.tsx
import * as React from "react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { ResearchSidebar } from "./_components/research-sidebar";

export const metadata = {
  title: "Research — LegAI",
  description: "AI-powered legal research across Malaysian statutes, cases, and practice directions.",
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardShell showBreadcrumbs={false} fullBleed>
      <div className="flex min-h-[calc(100dvh-7rem)]">
        <aside
          aria-label="Research navigation"
          className="hidden w-60 shrink-0 border-r border-border/60 md:block"
        >
          <ResearchSidebar />
        </aside>
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
    </DashboardShell>
  );
}
