// app/matters/layout.tsx
import * as React from "react";
import { MattersSidebar } from "./_components/sidebar";

export default function MattersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 md:block">
        <MattersSidebar />
      </aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
