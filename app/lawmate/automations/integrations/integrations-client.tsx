// app/lawmate/automations/integrations/integrations-client.tsx
"use client";
import * as React from "react";
import { IntegrationGrid, type Integration } from "@/components/automation";
import { toast } from "sonner";
import { trpcReact } from "@/clients";

export function IntegrationsPage() {
  const { data: integrationsData, isLoading, error } = trpcReact.automations.integrations.useQuery(
    undefined,
    { refetchOnWindowFocus: false }
  );

  const integrations = integrationsData?.items ?? [];

  if (isLoading) {
    return (
      <div className="flex h-full flex-col">
        <header className="border-b border-border/60 px-4 py-3">
          <h1 className="text-lg font-semibold">Integrations</h1>
          <p className="text-xs text-muted-foreground">Connect services your workflows can use as steps.</p>
        </header>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">Loading integrations…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <header className="border-b border-border/60 px-4 py-3">
          <h1 className="text-lg font-semibold">Integrations</h1>
          <p className="text-xs text-muted-foreground">Connect services your workflows can use as steps.</p>
        </header>
        <div className="flex h-full items-center justify-center p-6">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Integrations</h1>
        <p className="text-xs text-muted-foreground">Connect services your workflows can use as steps.</p>
      </header>
      <div className="p-4">
        <IntegrationGrid
          integrations={integrations}
          onConnect={(i) => toast.success(`Connect ${i.name} (not yet implemented)`)}
          onDisconnect={(i) => toast.success(`Disconnect ${i.name} (not yet implemented)`)}
          onConfigure={(i) => {
            // Only webhook is configurable in our mock registry
            if (i.id === 'webhook') {
              toast.success(`Configure ${i.name} (not yet implemented)`);
            } else {
              toast.error(`${i.name} is not configurable`);
            }
          }}
        />
      </div>
    </div>
  );
}