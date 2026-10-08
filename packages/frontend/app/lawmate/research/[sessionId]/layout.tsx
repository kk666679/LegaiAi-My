// app/lawmate/research/[sessionId]/layout.tsx
import * as React from "react";
import { SessionScopedNav } from "./_components/session-scoped-nav";

export default function SessionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { sessionId: string };
}) {
  return (
    <div className="flex h-full flex-col">
      <SessionScopedNav id={params.sessionId} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
