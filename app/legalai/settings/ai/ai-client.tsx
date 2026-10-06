"use client";
// app/legalai/settings/ai/ai-client.tsx
import * as React from "react";
import { Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection, SettingsField, SettingsRow } from "../_components/settings-section";
import { toast } from "sonner";

const DEFAULT_MODELS = [
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", hint: "Balanced — recommended" },
  { value: "claude-opus-4-5", label: "Claude Opus 4.5", hint: "Most capable — slower" },
  { value: "gpt-4o", label: "GPT-4o", hint: "Fast general purpose" },
  { value: "gpt-4o-mini", label: "GPT-4o mini", hint: "Cheapest — light tasks" },
  { value: "gemini-2-pro", label: "Gemini 2 Pro", hint: "Long context" },
];

const TONE_OPTIONS = [
  { value: "formal", label: "Formal" },
  { value: "neutral", label: "Neutral" },
  { value: "conversational", label: "Conversational" },
];

export function AISettings() {
  const [defaultModel, setDefaultModel] = React.useState("claude-sonnet-4-5");
  const [draftingModel, setDraftingModel] = React.useState("claude-sonnet-4-5");
  const [analysisModel, setAnalysisModel] = React.useState("claude-opus-4-5");
  const [confidenceThreshold, setConfidenceThreshold] = React.useState([70]);
  const [tone, setTone] = React.useState("formal");
  const [customInstructions, setCustomInstructions] = React.useState("");
  const [autoCite, setAutoCite] = React.useState(true);
  const [humanReview, setHumanReview] = React.useState(true);
  const [piiRedaction, setPiiRedaction] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const onSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("AI preferences saved");
    }, 500);
  };

  return (
    <SettingsPage
      title="AI preferences"
      description="Control how LegAI uses models, thresholds, and behavioural guardrails."
      footer={{
        onSave,
        saving,
        hint: "Changes apply to new AI actions across the workspace.",
      }}
    >
      <SettingsSection
        title="Default models"
        description="Choose which model is used for each kind of task."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <SettingsField label="General" htmlFor="ai-default">
            <Select value={defaultModel} onValueChange={setDefaultModel}>
              <SelectTrigger id="ai-default">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label} <span className="text-xs text-muted-foreground">— {m.hint}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Drafting" htmlFor="ai-drafting">
            <Select value={draftingModel} onValueChange={setDraftingModel}>
              <SelectTrigger id="ai-drafting">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField label="Analysis" htmlFor="ai-analysis">
            <Select value={analysisModel} onValueChange={setAnalysisModel}>
              <SelectTrigger id="ai-analysis">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Confidence threshold"
        description="Below this threshold, AI outputs route to the human review queue."
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Minimum confidence</span>
            <span className="tabular-nums font-medium">{confidenceThreshold[0]}%</span>
          </div>
          <Slider
            value={confidenceThreshold}
            onValueChange={setConfidenceThreshold}
            min={0}
            max={100}
            step={5}
          />
          <p className="text-xs text-muted-foreground">
            Current threshold sends anything below {confidenceThreshold[0]}% to review.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection title="Drafting style" description="Default tone and formatting for AI-drafted text.">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <SettingsField label="Tone" htmlFor="ai-tone">
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="ai-tone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SettingsField>
          <SettingsField
            label="Custom instructions"
            description="Prepended to every drafting prompt."
            htmlFor="ai-instructions"
            className="md:col-span-2"
          >
            <Textarea
              id="ai-instructions"
              rows={4}
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Prefer Malaysian common law authorities. Always define acronyms on first use."
            />
          </SettingsField>
        </div>
      </SettingsSection>

      <SettingsSection title="Guardrails" description="Safety and compliance controls applied to all AI actions.">
        <div className="space-y-3">
          <SettingsRow
            label="Auto-cite authorities"
            description="Require citations for any legal proposition in AI output."
            control={<Switch checked={autoCite} onCheckedChange={setAutoCite} />}
          />
          <SettingsRow
            label="Human review for high-stakes actions"
            description="Route drafts, approvals, and escalations to the review queue."
            control={<Switch checked={humanReview} onCheckedChange={setHumanReview} />}
          />
          <SettingsRow
            label="Automatic PII redaction"
            description="Strip personal identifiers before sending to model providers."
            control={<Switch checked={piiRedaction} onCheckedChange={setPiiRedaction} />}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Workspace prompt" description="Persistent context that helps the AI understand your workspace.">
        <div className="flex items-start gap-3 rounded-md border border-primary/30 bg-primary/5 p-3">
          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Context block</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              We refer to the workspace as <strong>TechNova Legal</strong>. Default jurisdiction
              is <strong>Malaysia</strong>. Working language is <strong>English</strong>.
            </p>
            <button
              type="button"
              className="mt-2 text-xs text-primary hover:underline"
              onClick={() => toast.message("Workspace prompt editor opened")}
            >
              Edit workspace prompt
            </button>
          </div>
        </div>
      </SettingsSection>
    </SettingsPage>
  );
}
