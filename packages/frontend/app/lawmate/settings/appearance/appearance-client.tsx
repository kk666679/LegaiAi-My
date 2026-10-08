"use client";
// app/lawmate/settings/appearance/appearance-client.tsx
import * as React from "react";
import { Check, Moon, Monitor, Sun, Grid3x3, Rows3, Sparkles, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SettingsPage } from "../_components/settings-page";
import { SettingsSection, SettingsRow } from "../_components/settings-section";
import { toast } from "sonner";

type Theme = "light" | "dark" | "system";
type Density = "comfortable" | "compact";
type Font = "sans" | "serif" | "mono";

const ACCENTS = [
  { value: "violet", label: "Violet", hsl: "262 83% 58%" },
  { value: "blue", label: "Blue", hsl: "217 91% 60%" },
  { value: "emerald", label: "Emerald", hsl: "160 84% 39%" },
  { value: "amber", label: "Amber", hsl: "32 95% 44%" },
  { value: "rose", label: "Rose", hsl: "340 82% 52%" },
];

export function AppearanceSettings() {
  const [theme, setTheme] = React.useState<Theme>("system");
  const [density, setDensity] = React.useState<Density>("comfortable");
  const [font, setFont] = React.useState<Font>("sans");
  const [accent, setAccent] = React.useState("violet");
  const [reduceMotion, setReduceMotion] = React.useState(false);
  const [compactSidebar, setCompactSidebar] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const onSave = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Appearance updated");
    }, 400);
  };

  return (
    <SettingsPage
      title="Appearance"
      description="Personalise how LegAI looks and feels."
      footer={{ onSave, saving, hint: "Applies immediately across the workspace." }}
    >
      <SettingsSection title="Theme" description="Choose light, dark, or match your system.">
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { value: "light", label: "Light", icon: <Sun className="size-4" /> },
              { value: "dark", label: "Dark", icon: <Moon className="size-4" /> },
              { value: "system", label: "System", icon: <Monitor className="size-4" /> },
            ] as Array<{ value: Theme; label: string; icon: React.ReactNode }>
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTheme(t.value)}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-colors",
                theme === t.value
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-primary/40",
              )}
            >
              <span className={cn("rounded-md bg-muted p-1.5 text-muted-foreground", theme === t.value && "bg-primary/10 text-primary")}>
                {t.icon}
              </span>
              <span className="text-sm font-medium">{t.label}</span>
              {theme === t.value ? (
                <Check className="absolute right-2 top-2 size-3.5 text-primary" />
              ) : null}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Accent colour" description="Used for buttons, links, and highlights.">
        <div className="flex flex-wrap gap-3">
          {ACCENTS.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setAccent(a.value)}
              aria-label={a.label}
              className={cn(
                "relative size-9 rounded-full border-2 transition-transform hover:scale-105",
                accent === a.value ? "border-foreground" : "border-transparent",
              )}
              style={{ background: `hsl(${a.hsl})` }}
            >
              {accent === a.value ? (
                <Check className="absolute inset-0 m-auto size-4 text-white drop-shadow" />
              ) : null}
            </button>
          ))}
        </div>
      </SettingsSection>

      <SettingsSection title="Layout" description="How dense and dense things look.">
        <div className="space-y-3">
          <div>
            <p className="mb-2 text-sm font-medium">Density</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { value: "comfortable", label: "Comfortable", icon: <Grid3x3 className="size-4" /> },
                  { value: "compact", label: "Compact", icon: <Rows3 className="size-4" /> },
                ] as Array<{ value: Density; label: string; icon: React.ReactNode }>
              ).map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setDensity(d.value)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg border p-3 text-left transition-colors",
                    density === d.value
                      ? "border-primary bg-primary/5"
                      : "border-border/60 hover:border-primary/40",
                  )}
                >
                  <span className={cn("rounded-md bg-muted p-1.5 text-muted-foreground", density === d.value && "bg-primary/10 text-primary")}>
                    {d.icon}
                  </span>
                  <span className="text-sm font-medium">{d.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium">Body font</p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { value: "sans", label: "Sans serif" },
                  { value: "serif", label: "Serif" },
                  { value: "mono", label: "Monospace" },
                ] as Array<{ value: Font; label: string }>
              ).map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFont(f.value)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    font === f.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 text-muted-foreground hover:border-primary/40",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Motion & focus" description="Fine-tune animations and workspace chrome.">
        <div className="space-y-3">
          <SettingsRow
            label="Reduce motion"
            description="Minimise animations. Matches your OS setting automatically."
            control={<Switch checked={reduceMotion} onCheckedChange={setReduceMotion} />}
          />
          <SettingsRow
            label="Compact sidebar"
            description="Collapse the left navigation to icons only."
            control={<Switch checked={compactSidebar} onCheckedChange={setCompactSidebar} />}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Preview" description="See how the current theme looks.">
        <Card className="flex items-center justify-between gap-3 border-border/60 p-4">
          <div className="flex items-center gap-3">
            <div
              className="grid size-9 place-items-center rounded-md text-white"
              style={{ background: `hsl(${ACCENTS.find((a) => a.value === accent)?.hsl})` }}
            >
              <Sparkles className="size-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Preview your theme</p>
              <p className="text-xs text-muted-foreground">
                {theme} · {density} · {font} · {accent}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[10px] text-muted-foreground">
            <Zap className="size-3" /> Live
          </span>
        </Card>
      </SettingsSection>
    </SettingsPage>
  );
}
