"use client";
// app/legalai/settings/integrations/integrations-client.tsx
import * as React from "react";
import {
  Cloud, Database, FileText, MessageSquare, Search, Send,
  Webhook, Zap, BookOpen, Video, Calendar, CreditCard,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SettingsPage } from "../_components/settings-page";
import { toast } from "sonner";

interface Integration {
  id: string;
  name: string;
  description: string;
  category: "productivity" | "legal" | "storage" | "communication" | "payments";
  connected: boolean;
  icon: React.ReactNode;
}

const INTEGRATIONS: Integration[] = [
  { id: "slack", name: "Slack", description: "Send notifications and review updates to channels.", category: "communication", connected: true, icon: <MessageSquare className="size-4" /> },
  { id: "gmail", name: "Gmail", description: "Send and read email directly in matters.", category: "communication", connected: false, icon: <Send className="size-4" /> },
  { id: "gdrive", name: "Google Drive", description: "Sync documents and folders bidirectionally.", category: "storage", connected: true, icon: <Cloud className="size-4" /> },
  { id: "dropbox", name: "Dropbox", description: "Access and sync your Dropbox files.", category: "storage", connected: false, icon: <Database className="size-4" /> },
  { id: "notion", name: "Notion", description: "Embed matters and notes into Notion pages.", category: "productivity", connected: false, icon: <FileText className="size-4" /> },
  { id: "calendar", name: "Google Calendar", description: "Sync deadlines and hearings to your calendar.", category: "productivity", connected: true, icon: <Calendar className="size-4" /> },
  { id: "zoom", name: "Zoom", description: "Auto-create meeting links for hearings and calls.", category: "communication", connected: false, icon: <Video className="size-4" /> },
  { id: "lom", name: "LOM Malaysia", description: "Search Malaysian legislation and case law in-line.", category: "legal", connected: true, icon: <BookOpen className="size-4" /> },
  { id: "clj", name: "CLJ Law", description: "Access Current Law Journal reports and digests.", category: "legal", connected: false, icon: <Search className="size-4" /> },
  { id: "stripe", name: "Stripe", description: "Accept client payments directly on invoices.", category: "payments", connected: false, icon: <CreditCard className="size-4" /> },
  { id: "zapier", name: "Zapier", description: "Trigger 6,000+ app workflows from LegAI events.", category: "productivity", connected: false, icon: <Zap className="size-4" /> },
  { id: "webhook", name: "Custom webhook", description: "Send LegAI events to any HTTP endpoint.", category: "productivity", connected: true, icon: <Webhook className="size-4" /> },
];

const CATEGORIES = ["all", "productivity", "legal", "storage", "communication", "payments"] as const;

export function IntegrationsSettings() {
  const [category, setCategory] = React.useState<(typeof CATEGORIES)[number]>("all");
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return INTEGRATIONS.filter((i) => {
      if (category !== "all" && i.category !== category) return false;
      if (!q) return true;
      return `${i.name} ${i.description}`.toLowerCase().includes(q);
    });
  }, [category, query]);

  return (
    <SettingsPage
      title="Integrations"
      description="Connect LegAI to the tools your team already uses."
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search integrations"
            className="pl-9"
            aria-label="Search integrations"
          />
        </div>
        <Tabs value={category} onValueChange={(v) => setCategory(v as typeof category)}>
          <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
            {CATEGORIES.map((c) => (
              <TabsTrigger
                key={c}
                value={c}
                className="rounded-full border border-border/60 capitalize data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {c}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">
          No integrations match.
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => (
            <Card key={i.id} className="flex flex-col gap-3 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-muted p-2 text-muted-foreground">
                  {i.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{i.name}</p>
                    {i.connected ? (
                      <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                        Connected
                      </Badge>
                    ) : null}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {i.description}
                  </p>
                </div>
              </div>
              <div className="mt-auto flex gap-2">
                {i.connected ? (
                  <>
                    <Button size="sm" variant="outline">Configure</Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground"
                      onClick={() => toast.success(`Disconnected ${i.name}`)}
                    >
                      Disconnect
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`Connecting ${i.name}…`)}
                  >
                    Connect
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </SettingsPage>
  );
}
