"use client";
// app/legalai/settings/byok/byok-client.tsx
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

interface Provider {
  id: string;
  name: string;
  docsUrl?: string;
  keyPrefix?: string;
  configured: boolean;
  keyMasked?: string;
  lastUsed?: string;
}

const INITIAL: Provider[] = [
  { id: "anthropic", name: "Anthropic", keyPrefix: "sk-ant-", configured: true, keyMasked: "sk-ant-…4c8a", lastUsed: "2 minutes ago" },
  { id: "openai", name: "OpenAI", keyPrefix: "sk-", configured: true, keyMasked: "sk-…9b2f", lastUsed: "1 hour ago" },
  { id: "google", name: "Google AI", keyPrefix: "AIza", configured: false },
  { id: "azure", name: "Azure OpenAI", configured: false },
  { id: "openrouter", name: "OpenRouter", keyPrefix: "sk-or-", configured: false },
  { id: "custom", name: "Custom endpoint", configured: false },
];

export function BYOKSettings() {
  const [providers, setProviders] = React.useState<Provider[]>(INITIAL);
  const [editing, setEditing] = React.useState<Provider | null>(null);
  const [revealed, setRevealed] = React.useState(false);
  const [keyValue, setKeyValue] = React.useState("");
  const [removing, setRemoving] = React.useState<Provider | null>(null);
  const [preferBYOK, setPreferBYOK] = React.useState(true);

  const startEdit = (p: Provider) => {
    setEditing(p);
    setKeyValue("");
    setRevealed(false);
  };

  const saveKey = () => {
    if (!editing) return;
    if (!keyValue.trim()) {
      toast.error("Paste a valid API key");
      return;
    }
    setProviders((prev) =>
      prev.map((p) =>
        p.id === editing.id
          ? {
              ...p,
              configured: true,
              keyMasked: `${keyValue.slice(0, 8)}…${keyValue.slice(-4)}`,
              lastUsed: "Just now",
            }
          : p,
      ),
    );
    setEditing(null);
    toast.success(`${editing.name} key saved`);
  };

  const removeKey = () => {
    if (!removing) return;
    setProviders((prev) =>
      prev.map((p) =>
        p.id === removing.id ? { ...p, configured: false, keyMasked: undefined, lastUsed: undefined } : p,
      ),
    );
    setRemoving(null);
    toast.success("Key removed");
  };

  return (
    <SettingsPage
      title="API keys (BYOK)"
      description="Bring your own keys so AI usage is billed to your provider account and never leaves your control."
    >
      <SettingsSection title="Preferences" description="Control how keys are used across the workspace.">
        <div className="space-y-3">
          <SettingsRow
            label="Prefer BYOK when available"
            description="Use your own keys for AI requests when they're configured for the chosen model."
            control={<Switch checked={preferBYOK} onCheckedChange={setPreferBYOK} />}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Configured providers"
        description="Keys are encrypted at rest and never logged or shown in full."
      >
        <ul className="divide-y divide-border/60">
          {providers.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              <div className="rounded-md bg-muted p-2 text-muted-foreground">
                <KeyRound className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {p.configured ? (
                    <Badge variant="outline" className="border-transparent bg-emerald-500/10 text-[10px] text-emerald-600 dark:text-emerald-400">
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">Not configured</Badge>
                  )}
                </div>
                <p className="truncate font-mono text-xs text-muted-foreground">
                  {p.configured ? p.keyMasked : "No key"}{p.lastUsed ? ` · ${p.lastUsed}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="sm" variant="outline" onClick={() => startEdit(p)}>
                  {p.configured ? "Replace" : "Add key"}
                </Button>
                {p.configured ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${p.name} key`}
                    onClick={() => setRemoving(p)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
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
            <DialogTitle>{editing?.configured ? "Replace" : "Add"} {editing?.name} key</DialogTitle>
            <DialogDescription>
              Paste your API key. It will only be shown once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Input
                type={revealed ? "text" : "password"}
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder={editing?.keyPrefix ? `${editing.keyPrefix}…` : "Paste key"}
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
            <p className="text-xs text-muted-foreground">
              We never display the key in full after saving.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={saveKey} className="gap-1.5">
              <Plus className="size-3.5" /> Save key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!removing} onOpenChange={(o) => !o && setRemoving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {removing?.name} key?</AlertDialogTitle>
            <AlertDialogDescription>
              LegAI will fall back to the shared workspace credentials. Your key remains active at
              the provider until you revoke it there.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={removeKey}
            >
              Remove key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingsPage>
  );
}
