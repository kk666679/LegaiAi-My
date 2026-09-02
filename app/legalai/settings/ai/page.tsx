"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Sparkles,
  Cpu,
  Bot,
  Key,
  Save,
  ArrowRight,
  CheckCircle2,
  Zap,
  Eye,
  Lock,
} from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MODELS = [
  { id: "llama3.1:70b", name: "Llama 3.1 70B (local)", provider: "Ollama", tier: "Default" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI", tier: "Premium" },
  { id: "gpt-4o-mini", name: "GPT-4o mini", provider: "OpenAI", tier: "Fast" },
  { id: "claude-3.5-sonnet", name: "Claude 3.5 Sonnet", provider: "Anthropic", tier: "Premium" },
];

export default function AISettingsPage() {
  const [defaultModel, setDefaultModel] = useState("llama3.1:70b");
  const [humanReview, setHumanReview] = useState(true);
  const [citationCheck, setCitationCheck] = useState(true);
  const [streaming, setStreaming] = useState(true);
  const [redactPII, setRedactPII] = useState(true);

  return (
    <SettingsLayout>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Default model</CardTitle>
            <CardDescription>Model used for new conversations and tasks unless overridden.</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger>
                <Cpu className="size-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.provider} · {m.tier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Premium models may consume more credits. See <Link href="/legalai/billing" className="text-primary hover:underline">billing</Link>.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI behaviour</CardTitle>
            <CardDescription>Govern how AI generates and validates output.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <PrefRow
              label="Human review required for high-risk output"
              desc="Mandate explicit approval before applying AI suggestions on high-risk documents."
              icon={Eye}
              checked={humanReview}
              onChange={setHumanReview}
            />
            <PrefRow
              label="Citation check"
              desc="Verify citations against authoritative sources before returning answers."
              icon={CheckCircle2}
              checked={citationCheck}
              onChange={setCitationCheck}
            />
            <PrefRow
              label="Streaming responses"
              desc="Show AI output as it's generated."
              icon={Zap}
              checked={streaming}
              onChange={setStreaming}
            />
            <PrefRow
              label="Redact PII before AI"
              desc="Strip personal data from prompts sent to external providers."
              icon={Lock}
              checked={redactPII}
              onChange={setRedactPII}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">AI providers</CardTitle>
                <CardDescription>Configure external providers and BYOK keys.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <Link href="/legalai/settings/byok">
                  Manage <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <ProviderRow name="Ollama (local)" status="connected" models={["llama3.1:70b", "mistral", "qwen2.5"]} />
              <ProviderRow name="OpenAI" status="connected" models={["gpt-4o", "gpt-4o-mini"]} />
              <ProviderRow name="Anthropic" status="not_connected" models={["claude-3.5-sonnet"]} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            className="gap-2"
            onClick={() =>
              toast.success("AI settings saved", {
                description: `Model: ${MODELS.find((m) => m.id === defaultModel)?.name ?? defaultModel}`,
              })
            }
          >
            <Save className="size-4" /> Save AI settings
          </Button>
        </div>
      </div>
    </SettingsLayout>
  );
}

function PrefRow({ label, desc, icon: Icon, checked, onChange }: { label: string; desc: string; icon: any; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-card/30 p-3">
      <div className="flex items-start gap-3">
        <div className="flex size-8 items-center justify-center rounded-md bg-muted">
          <Icon className="size-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function ProviderRow({ name, status, models }: { name: string; status: "connected" | "not_connected"; models: string[] }) {
  return (
    <div className="flex items-center gap-3 rounded-md border bg-card/30 p-3">
      <div className="flex size-9 items-center justify-center rounded-md bg-muted">
        <Key className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium">{name}</p>
          {status === "connected" ? (
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Connected</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px]">Not connected</Badge>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">{models.join(", ")}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toast.info(`${name} provider settings`, { description: "Opens the AI providers (BYOK) page." })}
      >
        Configure
      </Button>
    </div>
  );
}
