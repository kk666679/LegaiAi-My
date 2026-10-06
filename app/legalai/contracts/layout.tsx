import * as React from "react";
import { ContractsSidebar } from "./_components/sidebar";

export default function ContractsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh">
      <aside className="hidden w-60 shrink-0 border-r border-border/60 md:block"><ContractsSidebar /></aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
