// app/lawmate/automations/[id]/versions/versions-client.tsx
"use client";
import * as React from "react";
import { VersionList } from "@/components/automation";
import type { WorkflowVersion } from "@/components/automation";
import { trpcReact } from "@/clients";
import { toast } from "sonner";
import { useParams } from "next/navigation";

export function WorkflowVersionsPage({ id }: { id: string }) {
  const [versions, setVersions] = React.useState<WorkflowVersion[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const workflowId = React.useMemo(() => id, [id]);

  React.useEffect(() => {
    const loadVersions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await trpcReact.automations.versions.list.query({ automationId: workflowId });
        const converted = data.items.map((v: any) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          summary: v.summary,
          authorName: v.authorName,
          createdAt: v.createdAt,
          isCurrent: v.isCurrent,
        }));
        setVersions(converted);
      } catch (err) {
        setError(`Failed to load versions: ${(err as Error)?.message ?? "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    };

    loadVersions();
  }, [workflowId]);

  const handleRestore = async (version: WorkflowVersion) => {
    try {
      await trpcReact.automations.versions.restore.mutate({
        automationId: workflowId,
        versionNumber: version.versionNumber,
      });
      toast.success(`Restored to version ${version.versionNumber}`);
      // Refresh versions list
      setIsLoading(true);
      setError(null);
      try {
        const data = await trpcReact.automations.versions.list.query({ automationId: workflowId });
        const converted = data.items.map((v: any) => ({
          id: v.id,
          versionNumber: v.versionNumber,
          summary: v.summary,
          authorName: v.authorName,
          createdAt: v.createdAt,
          isCurrent: v.isCurrent,
        }));
        setVersions(converted);
      } catch (err) {
        setError(`Failed to reload versions: ${(err as Error)?.message ?? "Unknown error"}`);
      } finally {
        setIsLoading(false);
      }
    } catch (err) {
      toast.error(`Failed to restore version: ${(err as Error)?.message ?? "Unknown error"}`);
    }
  };

  if (isLoading) {
    return <p className="p-6 text-sm text-muted-foreground">Loading versions…</p>;
  }

  if (error) {
    return <p className="p-6 text-xs text-destructive">{error}</p>;
  }

  return (
    <div className="p-4">
      <h2 className="mb-3 text-sm font-medium">Version history</h2>
      {versions.length === 0 ? (
        <p className="p-4 text-xs text-muted-foreground">
          No versions yet. Save the workflow to create the first version.
        </p>
      ) : (
        <VersionList
          versions={versions}
          onRestore={handleRestore}
        />
      )}
    </div>
  );
}