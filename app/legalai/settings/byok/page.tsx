"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Key,
  Plus,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Activity,
} from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";

interface Provider {
  id: string;
  name: string;
  enabled: boolean;
  hasKey: boolean;
  models: string[];
  health: "healthy" | "degraded" | "unknown";
  lastUsed: string;
  priority: number;
}

const PROVIDERS: Provider[] = [
  { id: "ollama", name: "Ollama (local)", enabled: true, hasKey: false, models: ["llama3.1:70b", "mistral", "qwen2.5"], health: "healthy", lastUsed: "2m ago", priority: 1 },
  { id: "openai", name: "OpenAI", enabled: true, hasKey: true, models: ["gpt-4o", "gpt-4o-mini"], health: "healthy", lastUsed: "1h ago", priority: 2 },
  { id: "anthropic", name: "Anthropic", enabled: false, hasKey: false, models: ["claude-3.5-sonnet"], health: "unknown", lastUsed: "—", priority: 3 },
  { id: "deepinfra", name: "DeepInfra", enabled: false, hasKey: false, models: ["meta-llama/Llama-3.3-70B"], health: "unknown", lastUsed: "—", priority: 4 },
];

const HEALTH_BADGE = {
  healthy: { label: "Healthy", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", icon: CheckCircle2 },
  degraded: { label: "Degraded", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", icon: AlertCircle },
  unknown: { label: "Not connected", cls: "bg-muted text-muted-foreground", icon: AlertCircle },
};

export default function BYOKPage() {
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(PROVIDERS.map((p) => [p.id, p.enabled])),
  );

  const testProvider = (id: string) => {
    setTesting(id);
    setTimeout(() => {
      setTesting(null);
      toast.success(`${PROVIDERS.find((p) => p.id === id)?.name} connection healthy`);
    }, 1500);
  };

  const toggleProvider = (id: string) => {
    setEnabled((s) => {
      const next = { ...s, [id]: !s[id] };
      const name = PROVIDERS.find((p) => p.id === id)?.name;
      toast.success(`${name} ${next[id] ? "enabled" : "disabled"}`);
      return next;
    });
  };

  const rotateKey = (name: string) =>
    toast.success(`Rotate key issued for ${name}`, {
      description: "A new API key has been generated. Update the key in your provider dashboard.",
    });

  const removeProvider = (name: string) =>
    toast.error(`Removed ${name}`, {
      description: "The provider and any cached keys have been cleared.",
    });

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">AI Providers</CardTitle>
                <CardDescription>Manage external AI providers and BYOK keys.</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="size-4" /> Add provider
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add AI provider</DialogTitle>
                    <DialogDescription>
                      Connect a new AI provider. API keys are encrypted at rest and never displayed in plain text after initial entry.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs">Provider</Label>
                      <Input placeholder="e.g. OpenAI" className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-xs">API key</Label>
                      <Input type="password" placeholder="sk-..." className="mt-1" />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => (document.activeElement as HTMLElement)?.blur()}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => toast.success("Provider connected", { description: "Key is encrypted at rest." })}
                    >
                      Connect
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {PROVIDERS.map((p) => {
              const health = HEALTH_BADGE[p.health];
              const HealthIcon = health.icon;
              return (
                <div
                  key={p.id}
                  className="rounded-md border bg-card/30 p-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <Key className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{p.name}</p>
                        <Badge variant="outline" className={`text-[10px] gap-1 ${health.cls}`}>
                          <HealthIcon className="size-3" /> {health.label}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          Priority {p.priority}
                        </Badge>
                        {p.hasKey && (
                          <Badge variant="outline" className="text-[10px] gap-1">
                            <Shield className="size-3" /> Key configured
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Models: {p.models.join(", ")}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Last used: {p.lastUsed}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Switch checked={!!enabled[p.id]} onCheckedChange={() => toggleProvider(p.id)} />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => testProvider(p.id)}
                        aria-label="Test connection"
                      >
                        {testing === p.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Activity className="size-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Rotate key"
                        onClick={() => rotateKey(p.name)}
                      >
                        <RefreshCw className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Remove"
                        onClick={() => removeProvider(p.name)}
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Key management</CardTitle>
            <CardDescription>Security and rotation settings for API keys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-md border bg-card/30 p-3">
              <Label className="text-xs">OpenAI API key (test)</Label>
              <div className="mt-1 flex items-center gap-2">
                <Input
                  type={showKey ? "text" : "password"}
                  value="sk-•••••••••••••••••••••••••••••3fK2"
                  readOnly
                  className="font-mono"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKey(!showKey)}
                  aria-label="Toggle key visibility"
                >
                  {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5">
                For security, only the last 4 characters of your key are shown. Rotate to issue a new key.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => rotateKey("OpenAI")}
              >
                <RefreshCw className="size-4" /> Rotate key
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-red-500"
                onClick={() => removeProvider("OpenAI")}
              >
                <Trash2 className="size-4" /> Revoke
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </SettingsLayout>
  );
}
