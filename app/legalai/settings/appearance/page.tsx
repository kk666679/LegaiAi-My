"use client";

import { useState } from "react";
import { Sun, Moon, Monitor, Palette } from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>Choose your preferred colour theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
              {THEMES.map((t) => {
                const Icon = t.icon;
                const active = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={cn(
                      "flex flex-col items-center gap-2 rounded-md border p-4 transition-colors",
                      active ? "border-primary bg-primary/5" : "hover:bg-accent/30",
                    )}
                  >
                    <Icon className={cn("size-5", active && "text-primary")} />
                    <span className="text-sm font-medium">{t.label}</span>
                  </button>
                );
              })}
            </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Density</CardTitle>
          <CardDescription>Adjust the spacing density of the interface.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setDensity("comfortable");
                toast.success("Density set to Comfortable");
              }}
              className={cn(
                "rounded-md border p-4 text-left transition-colors",
                density === "comfortable"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/30",
              )}
            >
              <p className="text-sm font-medium">Comfortable</p>
              <p className="text-xs text-muted-foreground mt-0.5">More breathing room.</p>
            </button>
            <button
              onClick={() => {
                setDensity("compact");
                toast.success("Density set to Compact");
              }}
              className={cn(
                "rounded-md border p-4 text-left transition-colors",
                density === "compact"
                  ? "border-primary bg-primary/5"
                  : "hover:bg-accent/30",
              )}
            >
              <p className="text-sm font-medium">Compact</p>
              <p className="text-xs text-muted-foreground mt-0.5">Denser information.</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
