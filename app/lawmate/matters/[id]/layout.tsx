import * as React from "react";
import { MatterScopedNav } from "./_components/matter-nav";

export default function MatterLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return (
    <div className="flex h-full flex-col">
      <MatterScopedNav id={params.id} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
