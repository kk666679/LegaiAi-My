"use client";

import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { DocumentsShell } from "@/components/documents";
import { DocumentsHub } from "@/components/documents/DocumentsHub";

export default function DocumentsPage() {
  return (
    <DashboardShell>
      <DocumentsShell>
        <DocumentsHub />
      </DocumentsShell>
    </DashboardShell>
  );
}
