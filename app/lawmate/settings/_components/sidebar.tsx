"use client";
// app/lawmate/settings/_components/sidebar.tsx
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell, Bot, KeyRound, Palette, Plug, ShieldCheck, User, Users,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  exact?: boolean;
}

const GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Account",
    items: [
      { href: "/lawmate/settings", label: "Overview", description: "Workspace at a glance", icon: <Settings2 className="size-4" />, exact: true },
      { href: "/lawmate/settings/profile", label: "Profile", description: "Your name, photo, and bio", icon: <User className="size-4" /> },
      { href: "/lawmate/settings/security", label: "Security", description: "Password, sessions, 2FA", icon: <ShieldCheck className="size-4" /> },
    ],
  },
  {
    title: "Workspace",
    items: [
      { href: "/lawmate/settings/users", label: "Team", description: "Members and roles", icon: <Users className="size-4" /> },
      { href: "/lawmate/settings/integrations", label: "Integrations", description: "Connect external tools", icon: <Plug className="size-4" /> },
    ],
  },
  {
    title: "AI",
    items: [
      { href: "/lawmate/settings/ai", label: "AI preferences", description: "Models, thresholds, tone", icon: <Bot className="size-4" /> },
      { href: "/lawmate/settings/byok", label: "API keys (BYOK)", description: "Bring your own provider keys", icon: <KeyRound className="size-4" /> },
    ],
  },
  {
    title: "Preferences",
    items: [
      { href: "/lawmate/settings/notifications", label: "Notifications", description: "Email, in-app, digests", icon: <Bell className="size-4" /> },
      { href: "/lawmate/settings/appearance", label: "Appearance", description: "Theme, density, motion", icon: <Palette className="size-4" /> },
    ],
  },
];

export function SettingsSidebar() {
  const pathname = usePathname();
  return (
    <nav aria-label="Settings" className="space-y-5">
      {GROUPS.map((group) => (
        <section key={group.title}>
          <p className="mb-1.5 px-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Button
                    asChild
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    className={cn(
                      "h-auto w-full justify-start gap-2 py-2",
                      active && "font-medium",
                    )}
                  >
                    <Link href={item.href} className="flex items-start gap-2">
                      <span className={cn("mt-0.5 shrink-0", active ? "text-foreground" : "text-muted-foreground")}>
                        {item.icon}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col items-start">
                        <span className="truncate text-sm">{item.label}</span>
                        {item.description ? (
                          <span className="truncate text-[11px] font-normal text-muted-foreground">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </Button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
