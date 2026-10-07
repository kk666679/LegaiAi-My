// app/legalai/agents/layout.tsx
import * as React from "react";

export const metadata = {
  title: "Agents — LegAI",
  description: "Monitor, run, and govern AI agents across the workspace.",
};

export default function AgentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh">
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
