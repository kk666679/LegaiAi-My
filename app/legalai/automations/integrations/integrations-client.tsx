"use client";
import * as React from "react";
import { IntegrationGrid, type Integration } from "@/components/automation";
import { toast } from "sonner";

const MOCK: Integration[] = [
  { id: "slack", name: "Slack", description: "Notify channels and request approvals.", category: "communication", connected: false },
  { id: "gmail", name: "Gmail", description: "Send and read email.", category: "communication", connected: false },
  { id: "gdrive", name: "Google Drive", description: "Store and read documents.", category: "storage", connected: false },
  { id: "dropbox", name: "Dropbox", description: "Sync documents.", category: "storage", connected: false },
  { id: "notion", name: "Notion", description: "Sync matter notes and docs.", category: "productivity", connected: false },
  { id: "lom", name: "LOM Malaysia", description: "Query Malaysian legislation.", category: "legal", connected: true },
  { id: "custom", name: "Custom webhook", description: "Connect any HTTP endpoint.", category: "custom", connected: false },
];

export function IntegrationsPage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border/60 px-4 py-3">
        <h1 className="text-lg font-semibold">Integrations</h1>
        <p className="text-xs text-muted-foreground">Connect services your workflows can use as steps.</p>
      </header>
      <div className="p-4">
        <IntegrationGrid
          integrations={MOCK}
          onConnect={(i) => toast.success(`Connect ${i.name}`)}
          onDisconnect={(i) => toast.success(`Disconnect ${i.name}`)}
          onConfigure={(i) => toast.message(`Configure ${i.name}`)}
        />
      </div>
    </div>
  );
}
