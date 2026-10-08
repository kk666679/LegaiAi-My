"use client";
// app/lawmate/settings/_components/overview-client.tsx
import * as React from "react";
import Link from "next/link";
import {
  ArrowRight, Bell, Bot, KeyRound, Palette, Plug, ShieldCheck,
  User, Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SettingsPage } from "./settings-page";

interface Tile {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  badge?: string;
}

const TILES: Tile[] = [
  { href: "/lawmate/settings/profile", label: "Profile", description: "Your name, photo, and timezone.", icon: <User className="size-4" /> },
  { href: "/lawmate/settings/security", label: "Security", description: "Password, two-factor, and sessions.", icon: <ShieldCheck className="size-4" />, badge: "2FA on" },
  { href: "/lawmate/settings/users", label: "Team", description: "Invite members and assign roles.", icon: <Users className="size-4" />, badge: "5 members" },
  { href: "/lawmate/settings/integrations", label: "Integrations", description: "Slack, LOM, Drive, and more.", icon: <Plug className="size-4" /> },
  { href: "/lawmate/settings/ai", label: "AI preferences", description: "Models, thresholds, and tone.", icon: <Bot className="size-4" /> },
  { href: "/lawmate/settings/byok", label: "API keys (BYOK)", description: "Bring your own provider keys.", icon: <KeyRound className="size-4" />, badge: "2 keys" },
  { href: "/lawmate/settings/notifications", label: "Notifications", description: "Email, in-app, and digests.", icon: <Bell className="size-4" /> },
  { href: "/lawmate/settings/appearance", label: "Appearance", description: "Theme, density, and motion.", icon: <Palette className="size-4" /> },
];

export function SettingsOverview() {
  return (
    <SettingsPage
      title="Settings"
      description="Manage your account, workspace, and preferences in one place."
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {TILES.map((tile) => (
          <Card
            key={tile.href}
            className="group flex flex-col gap-3 p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <div className="rounded-md bg-muted p-2 text-muted-foreground">
                  {tile.icon}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{tile.label}</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {tile.description}
                  </p>
                </div>
              </div>
              {tile.badge ? (
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {tile.badge}
                </Badge>
              ) : null}
            </div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="ml-auto h-7 gap-1 px-2 text-xs"
            >
              <Link href={tile.href}>
                Open <ArrowRight className="size-3" />
              </Link>
            </Button>
          </Card>
        ))}
      </div>
    </SettingsPage>
  );
}
