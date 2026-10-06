"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { User, Shield, Palette, Bell, Cpu, Plug, Key, Users as UsersIcon } from "lucide-react";

const TABS = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "ai", label: "AI", icon: Cpu },
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "byok", label: "BYOK", icon: Key },
  { id: "users", label: "Users", icon: UsersIcon },
] as const;

export default function SettingsPage() {
  return (
    <React.Suspense
      fallback={
        <DashboardShell>
          <div className="space-y-6">
            <PageHeader
              title="Settings"
              description="Manage your workspace, integrations, and AI governance."
            />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </DashboardShell>
      }
    >
      <SettingsPageContent />
    </React.Suspense>
  );
}

function SettingsPageContent() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") ?? "profile";
  const [activeTab, setActiveTab] = React.useState(defaultTab);

  const { data: me, isLoading: meLoading } = trpcReact.auth.me.useQuery(undefined, { staleTime: 60_000 });
  const { data: users, isLoading: usersLoading } = trpcReact.auth.listUsers.useQuery({ limit: 50 }, { staleTime: 60_000 });
  const { data: providers, isLoading: providersLoading } = trpcReact.provider.listKeys.useQuery(undefined, { staleTime: 60_000 });
  const { data: killSwitch, isLoading: killSwitchLoading } = trpcReact.governance.getKillSwitchStatus.useQuery(undefined, { staleTime: 30_000 });
  const { data: logs, isLoading: logsLoading } = trpcReact.governance.getLogs.useQuery({ limit: 20 }, { staleTime: 30_000 });

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title="Settings"
          description="Manage your workspace, integrations, and AI governance."
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="gap-2">
                <t.icon className="size-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {meLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ) : me ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Name</label>
                      <Input value={me.name ?? ""} readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <Input value={me.email} readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Role</label>
                      <Input value={me.role} readOnly className="mt-1" />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Organisation</label>
                      <Input value={me.org?.name ?? "—"} readOnly className="mt-1" />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unable to load profile</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Password and authentication settings are managed server-side. Contact your administrator for changes.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Theme and appearance settings are managed locally in your browser preferences.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Configure your notification preferences. Alerts are generated by the system based on matter deadlines and AI actions.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  AI Governance
                  {killSwitchLoading ? <Skeleton className="h-4 w-20" /> : (
                    <Badge variant={killSwitch?.active ? "destructive" : "secondary"}>
                      {killSwitch?.active ? "Kill Switch Active" : "Operational"}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {killSwitchLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Kill switch status: {killSwitch?.active ? "ACTIVE" : "Inactive"}
                      {killSwitch?.activatedBy && ` by ${killSwitch.activatedBy}`}
                      {killSwitch?.activatedAt && ` at ${new Date(killSwitch.activatedAt).toLocaleString()}`}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Governance Logs</CardTitle>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : logs && logs.logs.length > 0 ? (
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-2">
                      {logs.logs.map((log: any) => (
                        <div key={log.id} className="flex items-center justify-between p-3 rounded-md border bg-card/40">
                          <div>
                            <p className="font-medium text-sm">{log.eventType}</p>
                            <p className="text-xs text-muted-foreground">{log.aiModel ?? "—"} · {log.provider ?? "—"}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No governance logs</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrations</CardTitle>
              </CardHeader>
              <CardContent>
                {providersLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : providers && providers.length > 0 ? (
                  <div className="space-y-2">
                    {providers.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-md border bg-card/40">
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.provider} · {p.defaultModel}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={p.isActive ? "secondary" : "outline"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                          {p.isDefault && <Badge variant="outline">Default</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Plug}
                    title="No integrations"
                    description="Configure AI provider integrations in the BYOK tab."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="byok" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bring Your Own Key (BYOK)</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Manage your AI provider API keys. Keys are encrypted and never exposed to the frontend.</p>
                {providers && providers.length > 0 ? (
                  <div className="space-y-2">
                    {providers.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-3 rounded-md border bg-card/40">
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.provider} · Key ref: {p.keyRef}</p>
                        </div>
                        <Badge variant={p.isActive ? "secondary" : "outline"}>{p.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    icon={Key}
                    title="No API keys configured"
                    description="Add your first provider key to enable BYOK mode."
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : users && users.length > 0 ? (
                  <ScrollArea className="max-h-[500px]">
                    <div className="space-y-2">
                      {users.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-md border bg-card/40">
                          <div>
                            <p className="font-medium text-sm">{u.name ?? u.email}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <Badge variant="secondary">{u.role}</Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-sm text-muted-foreground">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}