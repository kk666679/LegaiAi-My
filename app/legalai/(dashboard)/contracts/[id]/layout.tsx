import * as React from "react";
import { ContractScopedNav } from "../_components/contract-nav";

export default function ContractLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return (
    <div className="flex h-full flex-col">
      <ContractScopedNav id={params.id} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
