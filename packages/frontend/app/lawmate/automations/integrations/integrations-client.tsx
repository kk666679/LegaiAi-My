// app/lawmate/automations/integrations/integrations-client.tsx
"use client";
import * as React from "react";
import { IntegrationGrid, type Integration } from "@/components/automation";
import { toast } from "sonner";
import { trpcReact } from "@/clients";

export function IntegrationsPage() {
  const utils = trpcReact.useUtils();
  const connectWebhook = trpcReact.automations.connectWebhook.useMutation();
  const disconnectIntegration = trpcReact.automations.disconnectIntegration.useMutation();
  const beginOAuth = trpcReact.automations.beginIntegrationOAuth.useMutation();
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
          onConnect={(i) => {
            if (i.id !== "webhook") {
              beginOAuth.mutate({ provider: i.id }, {
                onSuccess: ({ authorizationUrl }: { authorizationUrl: string }) => window.location.assign(authorizationUrl),
                onError: (error: Error) => toast.error(error.message),
              });
              return;
            }
            const endpoint = window.prompt("Webhook HTTPS endpoint");
            if (!endpoint) return;
            const secret = window.prompt("Webhook signing secret (at least 16 characters)");
            if (!secret) return;
            connectWebhook.mutate({ endpoint, secret }, {
              onSuccess: async () => { await utils.automations.integrations.invalidate(); toast.success("Webhook connected"); },
              onError: (error: Error) => toast.error(error.message),
            });
          }}
          onDisconnect={(i) => i.id === "lom" ? toast.info("LOM Malaysia is a built-in legal source and cannot be disconnected.") : disconnectIntegration.mutate({ provider: i.id }, {
            onSuccess: async () => { await utils.automations.integrations.invalidate(); toast.success(`Disconnected ${i.name}`); },
            onError: (error: Error) => toast.error(error.message),
          })}
          onConfigure={(i) => {
            if (i.id === "lom") {
              toast.info("LOM Malaysia legal sources are managed by the platform.");
            } else if (i.id === 'webhook') {
              toast.info("To rotate webhook credentials, disconnect it and connect again with the new endpoint and signing secret.");
            } else {
              beginOAuth.mutate({ provider: i.id }, {
                onSuccess: ({ authorizationUrl }: { authorizationUrl: string }) => window.location.assign(authorizationUrl),
                onError: (error: Error) => toast.error(error.message),
              });
            }
          }}
        />
      </div>
    </div>
  );
}
