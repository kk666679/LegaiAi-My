"use client";

import Link from "next/link";
import { Plug, ExternalLink, Lock } from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Integrations are informational until an integration backend
// is available — no fake OAuth flows or simulated connects.
const INTEGRATIONS = [
  { name: "Microsoft 365", desc: "Sync documents, calendar and contacts.", category: "Productivity", status: "planned" as const },
  { name: "Google Workspace", desc: "Sync documents, calendar and contacts.", category: "Productivity", status: "planned" as const },
  { name: "DocuSign", desc: "Send documents for e-signature.", category: "E-signature", status: "planned" as const },
  { name: "Clio", desc: "Sync matters and contacts from Clio.", category: "Practice management", status: "planned" as const },
  { name: "iManage", desc: "Connect to your document management system.", category: "DMS", status: "planned" as const },
  { name: "Slack", desc: "Send notifications to Slack channels.", category: "Communication", status: "planned" as const },
  { name: "Teams", desc: "Send notifications to Microsoft Teams.", category: "Communication", status: "planned" as const },
];

export default function IntegrationsSettingsPage() {
  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-base">Available integrations</CardTitle>
              <CardDescription>
                Planned connectors for your existing tools.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((i) => (
              <div
                key={i.name}
                className="rounded-md border bg-card/30 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                    <Plug className="size-4 text-muted-foreground" aria-hidden />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium">{i.name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {i.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        Planned
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {i.desc}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled
                        className="gap-1.5"
                        aria-label={`${i.name} integration is planned`}
                      >
                        <Lock className="size-3.5" /> Coming soon
                      </Button>
                      <Button size="sm" variant="ghost" className="gap-1" asChild>
                        <Link href="/legalai/docs">
                          Learn more <ExternalLink className="size-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
