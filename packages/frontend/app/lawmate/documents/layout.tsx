// app/documents/layout.tsx
import * as React from "react";
import { DocumentsLayoutShell } from "./_components/documents-layout-shell";

export default function DocumentsLayout({ children }: { children: React.ReactNode }) {
  return <DocumentsLayoutShell>{children}</DocumentsLayoutShell>;
}
