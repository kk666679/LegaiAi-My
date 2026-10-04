"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User as UserIcon,
  Shield,
  Sparkles,
  Key,
  Palette,
  Plug,
  Settings as SettingsIcon,
  Users,
  Bell,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/components/auth-provider";
import { AdminGate } from "@/components/shared/PermissionGate";
import { cn } from "@/lib/utils";

const SETTINGS_NAV = [
  { href: "/legalai/settings", label: "General", icon: SettingsIcon },
  { href: "/legalai/settings/profile", label: "Profile", icon: UserIcon },
  { href: "/legalai/settings/security", label: "Security", icon: Shield },
  { href: "/legalai/settings/ai", label: "AI Settings", icon: Sparkles },
  { href: "/legalai/settings/byok", label: "AI Providers (BYOK)", icon: Key },
  { href: "/legalai/settings/notifications", label: "Notifications", icon: Bell },
  { href: "/legalai/settings/appearance", label: "Appearance", icon: Palette },
  { href: "/legalai/settings/integrations", label: "Integrations", icon: Plug },
  { href: "/legalai/settings/users", label: "Team & users", icon: Users, adminOnly: true },
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
          <nav className="space-y-1" aria-label="Settings">
            {SETTINGS_NAV.map((item) => {
              if (item.adminOnly) {
                return (
                  <AdminGate key={item.href}>
                    <SettingsNavLink item={item} pathname={pathname} />
                  </AdminGate>
                );
              }
              return <SettingsNavLink key={item.href} item={item} pathname={pathname} />;
            })}
          </nav>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </DashboardShell>
  );
}

function SettingsNavLink({
  item,
  pathname,
}: {
  item: { href: string; label: string; icon: React.ComponentType<{ className?: string }> };
  pathname: string;
}) {
  const Icon = item.icon;
  const isActive = pathname === item.href;
  return (
    <Link
      href={item.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-foreground font-medium"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {item.label}
    </Link>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <SettingsLayout>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Workspace and account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <InfoRow label="Workspace" value={user?.org?.name ?? "Personal workspace"} />
          <InfoRow label="Plan" value={<Badge variant="secondary" className="text-xs capitalize">{user?.org?.plan ?? "free"}</Badge>} />
          <Separator />
          <InfoRow label="Full name" value={user?.name ?? "—"} />
          <InfoRow label="Email" value={user?.email ?? "—"} />
          <InfoRow
            label="Role"
            value={<Badge variant="outline" className="gap-1 text-xs capitalize"><Shield className="size-3" aria-hidden />{user?.role ?? "viewer"}</Badge>}
          />
          <Separator />
          <p className="text-xs text-muted-foreground">
            Profile details and workspace settings are managed by your
            organisation administrator. Contact them to update your name,
            email address or role.
          </p>
        </CardContent>
      </Card>
    </SettingsLayout>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  );
}
