"use client";

import Link from "next/link";
import {
  Sparkles,
  Cpu,
  Key,
  ArrowRight,
  CheckCircle2,
  Eye,
  Lock,
  Zap,
} from "lucide-react";
import { trpcReact } from "@/clients";
import { usePermission } from "@/components/shared/PermissionGate";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { cn } from "@/lib/utils";

interface ProviderKey {
  id: string;
  name: string;
  provider: string;
  defaultModel: string;
  isActive: boolean;
  isDefault: boolean;
  executionMode: string;
}

export default function AISettingsPage() {
  const canView = usePermission("view_audit_log");
  const keysQuery = trpcReact.provider.listKeys.useQuery(undefined, {
    enabled: canView,
    staleTime: 30_000,
  });
  const keys = (keysQuery.data ?? []) as ProviderKey[];

  const activeProviders = keys.filter((k) => k.isActive);

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI safety defaults</CardTitle>
            <CardDescription>
              How AI output is governed in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <BehaviourRow
              icon={Eye}
              label="Human review for consequential actions"
              desc="Agent actions at authorisation level 2+ require explicit human approval before execution (HITL)."
            />
            <BehaviourRow
              icon={CheckCircle2}
              label="Citation validation"
              desc="Citations are verified against source material before drafting proceeds."
            />
            <BehaviourRow
              icon={Zap}
              label="Streaming responses"
              desc="AI output is shown as it is generated."
            />
            <BehaviourRow
              icon={Lock}
              label="PII redaction"
              desc="Personal data is redacted before prompts reach external providers."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base">AI providers</CardTitle>
                <CardDescription>
                  Configured providers and their default models.
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <Link href="/legalai/settings/byok">
                  Manage <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {keysQuery.isLoading ? (
              <ListSkeleton rows={3} />
            ) : keys.length === 0 ? (
              <EmptyState
                icon={Key}
                title="No providers configured"
                description="Connect an AI provider to enable AI features in this workspace."
                action="Open AI providers"
                actionHref="/legalai/settings/byok"
              />
            ) : (
              <div className="space-y-2">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className={cn(
                      "flex items-center gap-3 rounded-md border bg-card/30 p-3",
                      !key.isActive && "opacity-60",
                    )}
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Key className="size-4 text-muted-foreground" aria-hidden />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium">{key.name}</p>
                        {key.isDefault ? (
                          <Badge variant="secondary" className="text-[10px]">
                            Default
                          </Badge>
                        ) : null}
                        <Badge
                          variant="outline"
                          className={cn(
                            "gap-1 text-[10px]",
                            key.isActive
                              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                              : "text-muted-foreground",
                          )}
                        >
                          <span
                            className={cn(
                              "size-1.5 rounded-full",
                              key.isActive ? "bg-emerald-500" : "bg-muted-foreground",
                            )}
                            aria-hidden
                          />
                          {key.isActive ? "Active" : "Paused"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        <span className="font-mono">{key.defaultModel}</span>
                        {" · "}
                        {key.provider}
                        {" · "}
                        {key.executionMode}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="shrink-0"
                    >
                      <Link href="/legalai/settings/byok">Configure</Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="size-4 text-primary" /> About models
            </CardTitle>
            <CardDescription>
              Model routing is configured per provider.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Conversations and agent tasks use the default model of the
              active provider. Administrators can add, verify, rotate or
              remove credentials on the{" "}
              <Link href="/legalai/settings/byok" className="text-primary hover:underline">
                AI providers
              </Link>{" "}
              page. Confidential and privileged data is restricted to local
              models where configured.
            </p>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}

function BehaviourRow({
  icon: Icon,
  label,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border bg-card/30 p-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" aria-hidden />
      </div>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
      <CheckCircle2 className="ml-auto size-4 shrink-0 text-emerald-500" aria-hidden />
    </div>
  );
}
