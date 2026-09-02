"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  User as UserIcon,
  Bell,
  Shield,
  Sparkles,
  Key,
  Palette,
  Plug,
  Settings as SettingsIcon,
  Save,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MOCK_USER } from "@/lib/lawmate/data";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { href: "/legalai/settings", label: "General", icon: SettingsIcon },
  { href: "/legalai/settings/profile", label: "Profile", icon: UserIcon },
  { href: "/legalai/settings/security", label: "Security", icon: Shield },
  { href: "/legalai/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/legalai/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/legalai/settings/ai", label: "AI Settings", icon: Sparkles },
  { href: "/legalai/settings/byok", label: "AI Providers (BYOK)", icon: Key },
  { href: "/legalai/settings/integrations", label: "Integrations", icon: Plug },
];

export function SettingsLayout({ children, active }: { children: React.ReactNode; active?: string }) {
  const pathname = usePathname();
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your profile, security, AI providers and workspace preferences.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
          <nav className="space-y-1">
            {SETTINGS_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = active ? active === item.href : pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-primary/10 text-foreground font-medium"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </DashboardShell>
  );
}

export default function SettingsPage() {
  const [name, setName] = useState(MOCK_USER.name);
  const [email, setEmail] = useState(MOCK_USER.email);
  const [organisation, setOrganisation] = useState(MOCK_USER.organisation);

  const onSave = () =>
    toast.success("Settings saved", {
      description: `${name} · ${organisation}`,
    });

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Basic workspace information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-xs">Full name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Email</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" type="email" />
          </div>
          <div>
            <Label className="text-xs">Organisation</Label>
            <Input value={organisation} onChange={(e) => setOrganisation(e.target.value)} className="mt-1" />
          </div>
          <Separator />
          <div className="flex justify-end">
            <Button className="gap-2" onClick={onSave}>
              <Save className="size-4" /> Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}
