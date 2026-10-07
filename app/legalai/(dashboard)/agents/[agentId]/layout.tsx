import * as React from "react";
import { AgentScopedNav } from "../_components/agent-scoped-nav";

export default async function AgentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ agentId: string }>;
}) {
  const { agentId } = await params;
  return (
    <div className="flex h-full flex-col">
      <AgentScopedNav id={agentId} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}