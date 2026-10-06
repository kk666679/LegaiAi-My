"use client";
import * as React from "react";
import { VersionList } from "@/components/automation";
import type { WorkflowVersion } from "@/components/automation";

export function WorkflowVersionsPage({ id }: { id: string }) {
  const [versions, setVersions] = React.useState<WorkflowVersion[]>([]);
  React.useEffect(() => { /* GET /api/automations/:id/versions */ }, [id]);
  return (
    <div className="p-4">
      <h2 className="mb-3 text-sm font-medium">Version history</h2>
      <VersionList versions={versions} />
    </div>
  );
}
