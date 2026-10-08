import * as React from "react";
import { HITLNavigation } from "@/components/hitl";

export default function HITLLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh">
      <aside className="hidden w-64 shrink-0 border-r border-border/60 md:block"><HITLNavigation /></aside>
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}
