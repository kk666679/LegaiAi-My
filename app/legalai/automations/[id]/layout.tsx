// app/automations/[id]/layout.tsx
import * as React from "react";
import { WorkflowScopedNav } from "../_components/workflow-nav";

export default function WorkflowLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return (
    <div className="flex h-full flex-col">
      <WorkflowScopedNav id={params.id} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
