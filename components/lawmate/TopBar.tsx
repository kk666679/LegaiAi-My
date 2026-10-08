"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Plus,
  Menu,
  Sun,
  Moon,
  Monitor,
  LogOut,
  Settings,
  User as UserIcon,
  ChevronDown,
  Keyboard,
  HelpCircle,
  Sparkles,
  Command as CommandIcon,
  Languages,
  Check,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Kbd } from "@/components/ui/kbd";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { CommandPalette } from "@/components/lawmate/CommandPalette";
import { useAuth } from "@/components/auth-provider";
import { trpcReact } from "@/clients";
import { useTranslation } from "@/i18n/hooks/use-translation";
import { useI18n } from "@/i18n/hooks/use-i18n";
import { AdminGate } from "@/components/shared/PermissionGate";
import {
  LOCALE_META,
  locales,
  type Locale,
} from "@/i18n/config/locales";

function initials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "?";
}

interface TopBarProps {
  onMenu?: () => void;
  variant?: "desktop" | "drawer";
}

export function TopBar({ onMenu }: TopBarProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutKey, setShortcutKey] = useState("Ctrl");
  const { setTheme, theme } = useTheme();
  const { t, tGlobal } = useTranslation("topbar");
  const { locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const router = useRouter();

  // Live count of unacknowledged high-severity alerts for the
  // notification indicator (real data, no fabricated counts).
  const alerts = trpcReact.matters.getAlerts.useQuery(
    { limit: 50 },
    { refetchInterval: 60_000 },
  );
  const unread =
    (alerts.data as Array<{ severity: string }> | undefined)?.filter(
      (a: { severity: string }) =>
        a.severity === "high" || a.severity === "critical",
    ).length ?? 0;

  useEffect(() => {
    const isMac =
      typeof navigator !== "undefined" &&
      /Mac|iPhone|iPad/i.test(navigator.platform);
    setShortcutKey(isMac ? "⌘" : "Ctrl");

    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
      if (e.key === "/" && !e.metaKey && !e.ctrlKey) {
        const target = e.target as HTMLElement;
        if (
          target &&
          !["INPUT", "TEXTAREA"].includes(target.tagName) &&
          !target.isContentEditable
        ) {
          e.preventDefault();
          setPaletteOpen(true);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      // AuthProvider already cleared the local session;
      // navigate regardless of the server call outcome.
      router.push("/login");
    }
  };

  const displayName = user?.name ?? user?.email ?? "User";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/80 px-3 backdrop-blur supports-[backdrop-filter]:backdrop-blur sm:gap-3 sm:px-4">
      {onMenu && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenu}
          className="md:hidden"
          aria-label={tGlobal("sidebar.openMenu")}
        >
          <Menu className="size-4" aria-hidden />
        </Button>
      )}

      <button
        onClick={() => setPaletteOpen(true)}
        className="flex flex-1 items-center gap-2 rounded-md border bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
        aria-label={t("openCommandPalette")}
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden sm:inline truncate">
          {t("searchPlaceholder")}
        </span>
        <span className="sm:hidden truncate">{t("searchShort")}</span>
        <span className="ml-auto hidden gap-1 sm:inline-flex items-center">
          <Kbd>{shortcutKey}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <Button
        variant="default"
        size="sm"
        className="hidden gap-1.5 lg:inline-flex"
        onClick={() => router.push("/lawmate/assistant")}
      >
        <Sparkles className="size-4" />
        {t("askLawMate")}
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="hidden gap-1.5 md:inline-flex"
          >
            <Plus className="size-4" />
            <span className="hidden xl:inline">{t("new")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{t("createNew")}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/lawmate/documents/new" className="gap-2">
              <Plus className="size-4" /> {t("newDocument")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/lawmate/matters/new" className="gap-2">
              <Plus className="size-4" /> {t("newMatter")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/lawmate/contracts/new" className="gap-2">
              <Plus className="size-4" /> {t("newContract")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/lawmate/documents/new" className="gap-2">
              <Plus className="size-4" /> {t("uploadDocument")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button variant="ghost" size="icon" aria-label={t("notifications")} asChild>
        <Link href="/lawmate/hitl" className="relative">
          <Bell className="size-4" />
          {unread > 0 && (
            <span
              className="absolute right-1.5 top-1.5 flex size-1.5 rounded-full bg-red-500"
              aria-label={t("unreadAlerts", { count: unread })}
            >
              <span className="absolute inset-0 animate-ping rounded-full bg-red-500 opacity-75" />
            </span>
          )}
        </Link>
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 px-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                {initials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <span className="hidden md:inline max-w-28 truncate text-sm font-medium">
              {displayName.split(" ")[0]}
            </span>
            <ChevronDown className="size-3 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            <div className="flex flex-col">
              <span className="truncate">{displayName}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {user?.email}
              </span>
              {user?.org?.name && (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user.org.name}
                </span>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/lawmate/settings/profile" className="gap-2">
              <UserIcon className="size-4" /> {t("profile")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/lawmate/settings" className="gap-2">
              <Settings className="size-4" /> {t("settings")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/lawmate/settings/byok" className="gap-2">
              <Sparkles className="size-4" /> {t("aiSettings")}
            </Link>
          </DropdownMenuItem>
          <AdminGate>
            <DropdownMenuItem asChild>
              <Link href="/lawmate/settings/users" className="gap-2">
                <Users className="size-4" /> {t("teamAndUsers")}
              </Link>
            </DropdownMenuItem>
          </AdminGate>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Languages className="size-4" />
              <span className="ml-2">{t("language")}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {LOCALE_META[locale].flag} {LOCALE_META[locale].name}
              </span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="min-w-[16rem]">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                {t("chooseLanguage")}
              </DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={locale}
                onValueChange={(v) => setLocale(v as Locale)}
              >
                {locales.map((code) => (
                  <DropdownMenuRadioItem
                    key={code}
                    value={code}
                    className="gap-2"
                  >
                    <span className="text-base leading-none">
                      {LOCALE_META[code].flag}
                    </span>
                    <span className="flex-1">{LOCALE_META[code].name}</span>
                    <span className="text-xs text-muted-foreground">
                      {LOCALE_META[code].englishName}
                    </span>
                    {code === locale && (
                      <Check className="size-4 text-primary" />
                    )}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              {theme === "dark" ? (
                <Moon className="size-4" />
              ) : theme === "light" ? (
                <Sun className="size-4" />
              ) : (
                <Monitor className="size-4" />
              )}
              <span className="ml-2">{t("appearance")}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="size-4" /> {t("light")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="size-4" /> {t("dark")}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="size-4" /> {t("system")}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/resources/documentation" className="gap-2">
              <Keyboard className="size-4" /> {t("keyboardShortcuts")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/resources/documentation" className="gap-2">
              <HelpCircle className="size-4" /> {t("helpAndDocs")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              void handleLogout();
            }}
            className="text-red-500 focus:text-red-500"
          >
            <LogOut className="size-4" /> {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
