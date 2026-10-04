"use client";

import { useCallback, useEffect, useState } from "react";
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
  Star,
  Power,
} from "lucide-react";
import { trpcReact } from "@/clients";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { TableSkeleton } from "@/components/shared/PageSkeleton";
import { PermissionGate, usePermission } from "@/components/shared/PermissionGate";
import { cn } from "@/lib/utils";

type ProviderType =
  | "OPENAI"
  | "ANTHROPIC"
  | "GOOGLE"
  | "AZURE"
  | "AWS_BEDROCK"
  | "OLLAMA"
  | "OPENROUTER"
  | "CUSTOM";

const PROVIDER_OPTIONS: Array<{ value: ProviderType; label: string }> = [
  { value: "OLLAMA", label: "Ollama (local)" },
  { value: "OPENAI", label: "OpenAI" },
  { value: "ANTHROPIC", label: "Anthropic" },
  { value: "GOOGLE", label: "Google" },
  { value: "AZURE", label: "Azure OpenAI" },
  { value: "AWS_BEDROCK", label: "AWS Bedrock" },
  { value: "OPENROUTER", label: "OpenRouter" },
  { value: "CUSTOM", label: "Custom endpoint" },
];

const EXECUTION_MODES = [
  { value: "BYOK", label: "BYOK — your key" },
  { value: "HOSTED", label: "Hosted — platform key" },
  { value: "LOCAL", label: "Local — self-hosted" },
] as const;

interface ProviderKey {
  id: string;
  name: string;
  provider: ProviderType;
  defaultModel: string;
  isActive: boolean;
  isDefault: boolean;
  executionMode: string;
  priority: number;
  keyRef: string;
}

const PROVIDER_LABEL: Record<string, string> = Object.fromEntries(
  PROVIDER_OPTIONS.map((p) => [p.value, p.label]),
);

function providerLabel(provider: string) {
  return PROVIDER_LABEL[provider] ?? provider;
}

/** Masked display for a key reference. Never render secrets. */
function maskedKey(keyRef: string) {
  if (!keyRef) return "••••";
  const tail = keyRef.slice(-4);
  return `••••${tail.length === 4 ? tail : ""}`;
}

export default function BYOKPage() {
  const canManage = usePermission("manage_users");
  const canView = usePermission("view_audit_log");

  const keysQuery = trpcReact.provider.listKeys.useQuery(undefined, {
    enabled: canView,
    staleTime: 30_000,
  });
  const keys = (keysQuery.data ?? []) as ProviderKey[];

  const verifyKey = trpcReact.provider.verifyKey.useMutation();
  const setActive = trpcReact.provider.setActive.useMutation();
  const setDefault = trpcReact.provider.setDefault.useMutation();
  const deleteKey = trpcReact.provider.deleteKey.useMutation();
  const addKey = trpcReact.provider.addKey.useMutation();
  const rotateKey = trpcReact.provider.rotateKey.useMutation();

  // ── Add provider dialog state ──
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    provider: "OLLAMA" as ProviderType,
    name: "",
    apiKey: "",
    apiBaseUrl: "",
    defaultModel: "",
    executionMode: "BYOK" as "BYOK" | "HOSTED" | "LOCAL",
    priority: 0,
  });
  const [adding, setAdding] = useState(false);

  // ── Rotate dialog state ──
  const [rotateTarget, setRotateTarget] = useState<ProviderKey | null>(null);
  const [newKey, setNewKey] = useState("");
  const [rotating, setRotating] = useState(false);

  // ── Visibility toggle for the masked reference ──
  const [showRef, setShowRef] = useState(false);

  // Reset dialog state when closed.
  useEffect(() => {
    if (!addOpen) {
      setForm((f) => ({ ...f, apiKey: "", name: "", apiBaseUrl: "", defaultModel: "" }));
    }
  }, [addOpen]);

  useEffect(() => {
    if (!rotateTarget) setNewKey("");
  }, [rotateTarget]);

  const refetch = useCallback(() => {
    void keysQuery.refetch();
  }, [keysQuery]);

  const onAdd = async () => {
    if (!form.name.trim() || !form.defaultModel.trim()) {
      toast.error("Name and default model are required.");
      return;
    }
    if (form.provider !== "OLLAMA" && !form.apiKey.trim()) {
      toast.error("An API key is required for this provider.");
      return;
    }
    setAdding(true);
    try {
      await addKey.mutateAsync({
        provider: form.provider,
        name: form.name.trim(),
        apiKey: form.apiKey,
        apiBaseUrl: form.apiBaseUrl.trim() ? form.apiBaseUrl.trim() : undefined,
        defaultModel: form.defaultModel.trim(),
        executionMode: form.executionMode,
        priority: form.priority,
      });
      toast.success("Provider connected", {
        description: "The credential was verified and stored encrypted.",
      });
      setAddOpen(false);
      refetch();
    } catch (err) {
      // Never surface raw stack traces; show a safe message.
      toast.error(
        err instanceof Error && err.message
          ? err.message.slice(0, 160)
          : "Could not verify the credential. Check the key and endpoint.",
      );
    } finally {
      setAdding(false);
    }
  };

  const onVerify = async (key: ProviderKey) => {
    try {
      const res = await verifyKey.mutateAsync({ id: key.id });
      toast.success(
        res.verified
          ? `${providerLabel(key.provider)} connection healthy`
          : `${providerLabel(key.provider)} connection failed`,
      );
      refetch();
    } catch {
      toast.error("Connection test failed.");
    }
  };

  const onToggleActive = async (key: ProviderKey) => {
    try {
      await setActive.mutateAsync({ id: key.id, active: !key.isActive });
      refetch();
    } catch {
      toast.error("Could not update the provider.");
    }
  };

  const onSetDefault = async (key: ProviderKey) => {
    try {
      await setDefault.mutateAsync({ id: key.id });
      toast.success(`${providerLabel(key.provider)} is now the default provider.`);
      refetch();
    } catch {
      toast.error("Could not set the default provider.");
    }
  };

  const onRotate = async () => {
    if (!rotateTarget || !newKey.trim()) {
      toast.error("Enter the new API key.");
      return;
    }
    setRotating(true);
    try {
      await rotateKey.mutateAsync({ id: rotateTarget.id, newApiKey: newKey.trim() });
      toast.success("Credential rotated", {
        description: "The old key is no longer usable.",
      });
      setRotateTarget(null);
      refetch();
    } catch (err) {
      toast.error(
        err instanceof Error && err.message ? err.message.slice(0, 160) : "Rotation failed.",
      );
    } finally {
      setRotating(false);
    }
  };

  const onDelete = async (key: ProviderKey) => {
    try {
      await deleteKey.mutateAsync({ id: key.id });
      toast.success(`${providerLabel(key.provider)} removed.`);
      refetch();
    } catch {
      toast.error("Could not remove the provider.");
    }
  };

  if (!canView) {
    return (
      <SettingsLayout>
        <EmptyState
          icon={Shield}
          title="Insufficient permissions"
          description="You need auditor or administrator access to view AI provider configuration."
        />
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">AI providers</CardTitle>
                <CardDescription>
                  Manage external AI providers and BYOK credentials. Keys are
                  encrypted at rest and never displayed in plain text.
                </CardDescription>
              </div>
              <PermissionGate permission="manage_users">
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2">
                      <Plus className="size-4" /> Add provider
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add AI provider</DialogTitle>
                      <DialogDescription>
                        Connect a new provider. The key is verified immediately,
                        then stored encrypted.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="byok-provider">Provider</Label>
                        <Select
                          value={form.provider}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, provider: v as ProviderType }))
                          }
                        >
                          <SelectTrigger id="byok-provider">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROVIDER_OPTIONS.map((p) => (
                              <SelectItem key={p.value} value={p.value}>
                                {p.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="byok-name">Display name</Label>
                        <Input
                          id="byok-name"
                          placeholder="e.g. OpenAI — production"
                          value={form.name}
                          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="byok-key">API key</Label>
                        <Input
                          id="byok-key"
                          type="password"
                          placeholder={
                            form.provider === "OLLAMA" ? "Not required for local Ollama" : "sk-…"
                          }
                          value={form.apiKey}
                          onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value }))}
                          autoComplete="off"
                        />
                      </div>
                      {form.provider === "CUSTOM" && (
                        <div className="space-y-1.5">
                          <Label htmlFor="byok-url">API base URL</Label>
                          <Input
                            id="byok-url"
                            type="url"
                            placeholder="https://api.example.com/v1"
                            value={form.apiBaseUrl}
                            onChange={(e) => setForm((f) => ({ ...f, apiBaseUrl: e.target.value }))}
                          />
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <Label htmlFor="byok-model">Default model</Label>
                        <Input
                          id="byok-model"
                          placeholder="e.g. gpt-4o"
                          value={form.defaultModel}
                          onChange={(e) => setForm((f) => ({ ...f, defaultModel: e.target.value }))}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="byok-mode">Execution mode</Label>
                          <Select
                            value={form.executionMode}
                            onValueChange={(v) =>
                              setForm((f) => ({
                                ...f,
                                executionMode: v as "BYOK" | "HOSTED" | "LOCAL",
                              }))
                            }
                          >
                            <SelectTrigger id="byok-mode">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {EXECUTION_MODES.map((m) => (
                                <SelectItem key={m.value} value={m.value}>
                                  {m.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="byok-priority">Priority</Label>
                          <Input
                            id="byok-priority"
                            type="number"
                            min={0}
                            max={100}
                            value={form.priority}
                            onChange={(e) =>
                              setForm((f) => ({
                                ...f,
                                priority: Number(e.target.value) || 0,
                              }))
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={onAdd} disabled={adding}>
                        {adding ? <Loader2 className="size-4 animate-spin" /> : null}
                        Verify &amp; connect
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </PermissionGate>
            </div>
          </CardHeader>
          <CardContent>
            {keysQuery.isLoading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : keys.length === 0 ? (
              <EmptyState
                icon={Key}
                title="No providers configured"
                description={
                  canManage
                    ? "Add a provider to enable AI features with your own credentials."
                    : "Ask an administrator to configure an AI provider."
                }
                action={canManage ? "Add provider" : undefined}
              />
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead className="hidden sm:table-cell">Model</TableHead>
                      <TableHead className="hidden md:table-cell">Key</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Mode</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {keys.map((key) => (
                      <TableRow key={key.id} className={cn(!key.isActive && "opacity-60")}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Key className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                            <div className="flex flex-col">
                              <span className="font-medium">{key.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {providerLabel(key.provider)}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="font-mono text-xs">{key.defaultModel}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
                            {showRef ? key.keyRef : maskedKey(key.keyRef)}
                            <button
                              type="button"
                              onClick={() => setShowRef((s) => !s)}
                              className="text-muted-foreground hover:text-foreground"
                              aria-label={showRef ? "Hide key reference" : "Show key reference"}
                            >
                              {showRef ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                            </button>
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {key.isDefault ? (
                              <Badge variant="secondary" className="gap-1 text-[10px]">
                                <Star className="size-3" /> Default
                              </Badge>
                            ) : null}
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1 text-[10px]",
                                key.isActive
                                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-500"
                                  : "border-border text-muted-foreground",
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
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="text-xs text-muted-foreground">{key.executionMode}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void onVerify(key)}
                              aria-label={`Test ${key.name} connection`}
                              title="Test connection"
                            >
                              <Activity className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void onSetDefault(key)}
                              aria-label={`Set ${key.name} as default`}
                              title="Set as default"
                              disabled={key.isDefault}
                            >
                              <Star className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => void onToggleActive(key)}
                              aria-label={key.isActive ? `Pause ${key.name}` : `Activate ${key.name}`}
                              title={key.isActive ? "Pause" : "Activate"}
                            >
                              <Power className="size-4" />
                            </Button>
                            <PermissionGate permission="manage_users">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setRotateTarget(key)}
                                aria-label={`Rotate key for ${key.name}`}
                                title="Rotate key"
                              >
                                <RefreshCw className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => void onDelete(key)}
                                aria-label={`Remove ${key.name}`}
                                title="Remove"
                                className="text-red-500 hover:text-red-500"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </PermissionGate>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">How BYOK works</CardTitle>
            <CardDescription>
              Credential handling in this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <Shield className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  API keys are verified on save, encrypted at rest, and only ever
                  shown as a hashed reference (<code className="font-mono text-xs">keyRef</code>).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Rotation invalidates the previous key immediately. Set a provider
                  as default to route new AI tasks to it.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <span>
                  Only administrators can add, rotate or remove credentials.
                  Auditors and lawyers can view provider status.
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* ── Rotate key dialog ── */}
      <Dialog open={!!rotateTarget} onOpenChange={(open) => !open && setRotateTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rotate credential</DialogTitle>
            <DialogDescription>
              Enter the new API key for{" "}
              <span className="font-medium">{rotateTarget ? providerLabel(rotateTarget.provider) : ""}</span>
              {rotateTarget ? ` — ${rotateTarget.name}` : ""}. The previous key
              stops working immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="rotate-key">New API key</Label>
            <Input
              id="rotate-key"
              type="password"
              placeholder="sk-…"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              autoComplete="off"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRotateTarget(null)}>
              Cancel
            </Button>
            <Button onClick={() => void onRotate()} disabled={rotating || !newKey.trim()}>
              {rotating ? <Loader2 className="size-4 animate-spin" /> : null}
              Rotate key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsLayout>
  );
}
