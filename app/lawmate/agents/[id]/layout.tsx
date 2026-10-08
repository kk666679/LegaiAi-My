import * as React from "react";
import { AgentScopedNav } from "../_components/agent-scoped-nav";

export default function AgentLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return (
    <div className="flex h-full flex-col">
      <AgentScopedNav id={params.id} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
