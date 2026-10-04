"use client";

import { Sun, Moon, Monitor } from "lucide-react";
import { SettingsLayout } from "../page";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const THEMES = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "System", icon: Monitor },
] as const;

export default function AppearanceSettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Theme</CardTitle>
          <CardDescription>
            Choose your preferred colour theme. Applies immediately and is
            remembered on this device.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="grid grid-cols-3 gap-3"
            role="radiogroup"
            aria-label="Colour theme"
          >
            {THEMES.map((t) => {
              const Icon = t.icon;
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setTheme(t.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-md border p-4 transition-colors",
                    active
                      ? "border-primary bg-primary/5"
                      : "hover:bg-accent/30",
                  )}
                >
                  <Icon
                    className={cn("size-5", active && "text-primary")}
                    aria-hidden
                  />
                  <span className="text-sm font-medium">{t.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
