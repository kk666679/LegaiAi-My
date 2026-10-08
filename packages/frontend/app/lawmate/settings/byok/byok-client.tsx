"use client";
// app/lawmate/settings/byok/byok-client.tsx
import * as React from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, Plus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection, SettingsRow } from "../_components/settings-section";
import { toast } from "sonner";
import { trpcReact } from "@/clients";

const PROVIDER_OPTIONS = [
  { value: "ANTHROPIC", label: "Anthropic", keyPrefix: "sk-ant-", defaultModel: "claude-sonnet-4-5" },
  { value: "OPENAI", label: "OpenAI", keyPrefix: "sk-", defaultModel: "gpt-4o" },
  { value: "GOOGLE", label: "Google AI", keyPrefix: "", defaultModel: "gemini-2-pro" },
  { value: "AZURE", label: "Azure OpenAI", keyPrefix: "", defaultModel: "gpt-4o" },
  { value: "AWS_BEDROCK", label: "AWS Bedrock", keyPrefix: "", defaultModel: "claude-sonnet-4-5" },
  { value: "OLLAMA", label: "Ollama", keyPrefix: "", defaultModel: "llama3.1" },
  { value: "OPENROUTER", label: "OpenRouter", keyPrefix: "sk-or-", defaultModel: "anthropic/claude-sonnet-4-5" },
  { value: "CUSTOM", label: "Custom endpoint", keyPrefix: "", defaultModel: "" },
] as const;

export function BYOKSettings() {
  const { data: keys = [], isLoading, refetch } = trpcReact.provider.listKeys.useQuery(undefined, { staleTime: 10_000 });
  const addKey = trpcReact.provider.addKey.useMutation();
  const deleteKey = trpcReact.provider.deleteKey.useMutation();
  const setActive = trpcReact.provider.setActive.useMutation();
  const utils = trpcReact.useUtils();

  const [editing, setEditing] = React.useState<string | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [keyValue, setKeyValue] = React.useState("");
  const [keyName, setKeyName] = React.useState("");
  const [defaultModel, setDefaultModel] = React.useState("");
  const [apiBaseUrl, setApiBaseUrl] = React.useState("");
  const [removing, setRemoving] = React.useState<string | null>(null);

  const selectedProvider = PROVIDER_OPTIONS.find((p) => p.value === editing) ?? null;

  const startEdit = (providerValue: string) => {
    setEditing(providerValue);
    setKeyValue("");
    setKeyName("");
    setApiBaseUrl("");
    setRevealed(false);
    const prov = PROVIDER_OPTIONS.find((p) => p.value === providerValue);
    setDefaultModel(prov?.defaultModel ?? "");
  };

  const saveKey = async () => {
    if (!editing || !keyValue.trim()) {
      toast.error("Paste a valid API key");
      return;
    }
    try {
      await addKey.mutateAsync({
        provider: editing as any,
        name: keyName.trim() || (selectedProvider?.label ?? editing),
        apiKey: keyValue.trim(),
        defaultModel: defaultModel.trim() || (selectedProvider?.defaultModel ?? "unknown"),
        apiBaseUrl: apiBaseUrl.trim() || undefined,
        executionMode: "BYOK",
      });
      await utils.provider.listKeys.invalidate();
      setEditing(null);
      toast.success(`${selectedProvider?.label ?? editing} key saved`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save key");
    }
  };

  const removeKey = async () => {
    if (!removing) return;
    try {
      await deleteKey.mutateAsync({ id: removing });
      await utils.provider.listKeys.invalidate();
      setRemoving(null);
      toast.success("Key removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove key");
    }
  };

  const toggleActive = async (keyId: string, isActive: boolean) => {
    try {
      await setActive.mutateAsync({ id: keyId, active: isActive });
      await utils.provider.listKeys.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update key");
    }
  };

  return (
    <SettingsPage
      title="API keys (BYOK)"
      description="Bring your own keys so AI usage is billed to your provider account and never leaves your control."
    >
      <SettingsSection title="Preferences" description="Control how keys are used across the workspace.">
        <p className="text-sm text-muted-foreground">BYOK preference is managed automatically — your configured keys take priority when available.</p>
      </SettingsSection>

      <SettingsSection
        title="Configured providers"
        description="Keys are encrypted at rest and never logged or shown in full."
      >
        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading keys…</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {PROVIDER_OPTIONS.map((prov) => {
              const key = keys.find((k: any) => k.provider === prov.value);
              return (
                <li key={prov.value} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="rounded-md bg-muted p-2 text-muted-foreground">
                    <KeyRound className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{prov.label}</p>
                      {key ? (
                        <>
                          <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                            {key.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {key.isDefault && <Badge variant="outline" className="text-[10px]">Default</Badge>}
                        </>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">Not configured</Badge>
                      )}
                    </div>
                    <p className="truncate font-mono text-xs text-muted-foreground">
                      {key?.keyRef ? `${key.keyRef}` : "No key"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {key && (
                      <Switch checked={key.isActive} onCheckedChange={(v) => void toggleActive(key.id, v)} />
                    )}
                    <Button size="sm" variant="outline" onClick={() => startEdit(prov.value)}>
                      {key ? "Replace" : "Add key"}
                    </Button>
                    {key ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        aria-label={`Remove ${prov.label} key`}
                        onClick={() => setRemoving(key.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </SettingsSection>

      <SettingsSection title="Key security" description="How LegAI handles your provider keys.">
        <Card className="space-y-2 border-border/60 bg-muted/30 p-4 text-xs text-muted-foreground">
          <p>
            · Keys are encrypted with AES-256 at rest.
          </p>
          <p>
            · Keys are transmitted to providers over TLS and never logged, cached on disk, or exposed
            in any API response.
          </p>
          <p>
            · Only workspace admins can view or rotate keys.
          </p>
          <p>
            · Revoke a key at any time — we stop using it within seconds.
          </p>
        </Card>
      </SettingsSection>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add {selectedProvider?.label ?? "provider"} key</DialogTitle>
            <DialogDescription>
              Paste your API key. It will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Key name (optional)</label>
              <Input value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g. Production" className="mt-1" />
            </div>
            <div className="flex items-center gap-2">
              <Input
                type={revealed ? "text" : "password"}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder={selectedProvider?.keyPrefix ? `${selectedProvider.keyPrefix}…` : "Paste key"}
                className="font-mono text-xs"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="size-9"
                aria-label={revealed ? "Hide" : "Show"}
                onClick={() => setRevealed((v) => !v)}
              >
                {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Default model</label>
              <Input value={defaultModel} onChange={(e) => setDefaultModel(e.target.value)} placeholder="e.g. claude-sonnet-4-5" className="mt-1 font-mono text-xs" />
            </div>
            {selectedProvider?.value === "CUSTOM" && (
              <div>
                <label className="text-xs font-medium text-muted-foreground">API base URL (optional)</label>
                <Input value={apiBaseUrl} onChange={(e) => setApiBaseUrl(e.target.value)} placeholder="https://api.example.com/v1" className="mt-1 font-mono text-xs" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              We never display the key in full after saving.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={() => void saveKey()} disabled={addKey.isPending || !keyValue.trim()} className="gap-1.5">
              <Plus className="size-3.5" /> {addKey.isPending ? "Saving…" : "Save key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove key?</AlertDialogTitle>
            <AlertDialogDescription>
              LegAI will fall back to the shared workspace credentials. Your key remains active at
              the provider until you revoke it there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void removeKey()}
            >
              Remove key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPage>
  );
}
