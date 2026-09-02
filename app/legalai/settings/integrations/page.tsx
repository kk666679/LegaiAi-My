"use client";

import Link from "next/link";
import { toast } from "sonner";
import { Plug, Plus, CheckCircle2, ExternalLink } from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const INTEGRATIONS = [
  { id: "i-1", name: "Microsoft 365", desc: "Sync documents, calendar and contacts.", status: "available", category: "Productivity" },
  { id: "i-2", name: "Google Workspace", desc: "Sync documents, calendar and contacts.", status: "available", category: "Productivity" },
  { id: "i-3", name: "DocuSign", desc: "Send documents for e-signature.", status: "available", category: "E-signature" },
  { id: "i-4", name: "Clio", desc: "Sync matters and contacts from Clio.", status: "available", category: "Practice management" },
  { id: "i-5", name: "iManage", desc: "Connect to your document management system.", status: "coming_soon", category: "DMS" },
  { id: "i-6", name: "Slack", desc: "Send notifications to Slack channels.", status: "available", category: "Communication" },
  { id: "i-7", name: "Teams", desc: "Send notifications to Microsoft Teams.", status: "available", category: "Communication" },
];

export default function IntegrationsSettingsPage() {
  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Available integrations</CardTitle>
              <CardDescription>Connect LawMate to your existing tools.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTEGRATIONS.map((i) => (
              <div
                key={i.id}
                className="rounded-md border bg-card/30 p-3"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <Plug className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm">{i.name}</p>
                      <Badge variant="secondary" className="text-[10px]">{i.category}</Badge>
                      {i.status === "coming_soon" && (
                        <Badge variant="outline" className="text-[10px]">Planned</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{i.desc}</p>
                    <div className="mt-2 flex items-center gap-2">
                      {i.status === "available" ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5"
                          onClick={() =>
                            toast.success(`Connecting ${i.name}`, {
                              description: "OAuth flow opens in a new tab.",
                            })
                          }
                        >
                          <Plus className="size-3.5" /> Connect
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled
                          aria-label={`${i.name} is planned`}
                        >
                          Planned
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="gap-1" asChild>
                        <Link href={`/legalai/docs?integration=${i.id}`}>
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
