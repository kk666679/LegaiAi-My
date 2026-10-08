import * as React from "react";
import { DocumentScopedNav } from "./_components/document-nav";

export default function DocumentLayout({ children, params }: { children: React.ReactNode; params: { id: string } }) {
  return (
    <div className="flex h-full flex-col">
      <DocumentScopedNav id={params.id} />
      <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
