"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/navigation/Logo";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Scale,
  Menu,
  LayoutDashboard,
  Bot,
  FileText,
  Briefcase,
  Users,
  FileSignature,
  Shield,
  Bell,
  BarChart3,
  Gavel,
  BookOpen,
  Settings,
  Activity,
  Search,
  ChevronDown,
  ChevronRight,
  Swords,
  ClipboardList,
  Eye,
  Cpu,
  AlertTriangle,
  Workflow,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Core",
    items: [
      { href: "/legalai", label: "Dashboard", icon: LayoutDashboard },
      { href: "/legalai/agent", label: "AI Copilot", icon: Bot, badge: "AI" },
      { href: "/legalai/search", label: "Universal Search", icon: Search },
    ],
  },
  {
    label: "Practice",
    items: [
      { href: "/legalai/matters", label: "Matters", icon: Briefcase },
      { href: "/legalai/clients", label: "Clients", icon: Users },
      { href: "/legalai/documents", label: "Documents", icon: FileText },
      { href: "/legalai/draft", label: "Document Drafting", icon: FileText },
      { href: "/legalai/draft", label: "Drafting Studio", icon: FileSignature },
      { href: "/legalai/contracts", label: "Contracts", icon: FileSignature },
      { href: "/legalai/automations", label: "Automations", icon: Workflow },
      { href: "/legalai/debate", label: "Debate Simulation", icon: Swords },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/legalai/research", label: "Legal Research", icon: BookOpen },
      { href: "/legalai/insights", label: "Insights & Timeline", icon: ClipboardList },
      { href: "/legalai/risk", label: "Risk Engine", icon: AlertTriangle },
      { href: "/legalai/monitor", label: "Change Monitor", icon: Bell },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/legalai/hitl", label: "Agent Control (HITL)", icon: Eye, badge: "HITL" },
      { href: "/legalai/governance", label: "AI Governance", icon: Cpu },
      { href: "/legalai/audit", label: "Audit Trail", icon: Shield },
      { href: "/legalai/compliance", label: "Compliance", icon: ClipboardList },
    ],
  },
  {
    label: "Analytics",
    items: [
      { href: "/legalai/analytics", label: "Executive Analytics", icon: BarChart3 },
      { href: "/legalai/billing", label: "Billing Intelligence", icon: Activity },
    ],
  },
];

function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (label: string) =>
    setCollapsed((p) => ({ ...p, [label]: !p[label] }));

  return (
    <div className="flex flex-col gap-1 px-2">
      {NAV_GROUPS.map((group) => (
        <div key={group.label} className="mb-1">
          <button
            onClick={() => toggle(group.label)}
            className="flex w-full items-center justify-between px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
          >
            {group.label}
            {collapsed[group.label] ? (
              <ChevronRight className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
          </button>

          {!collapsed[group.label] && (
            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/legalai" && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all",
                      active
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="content-width safe-x">
        <div className="flex min-w-0 h-14 items-center justify-between gap-3">
          <Link href="/legalai" className="flex items-center">
            <Logo size="sm" />
          </Link>

          {/* Desktop quick nav */}
          <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 overflow-x-auto lg:flex">
            {NAV_GROUPS.flatMap((g) => g.items)
              .filter((i) =>
                [
                  "/legalai/agent",
                  "/legalai/matters",
                  "/legalai/documents",
                  "/legalai/contracts",
                  "/legalai/automations",
                  "/legalai/hitl",
                  "/legalai/governance",
                  "/legalai",
                ].includes(i.href)
              )
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              ))}
          </nav>

          {/* Mobile */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[min(20rem,calc(100vw-1rem))] p-0 overflow-y-auto safe-x">
              <div className="flex items-center gap-2 p-4 border-b">
                <Logo size="sm" />
              </div>
              <div className="py-4">
                <NavItems onNavigate={() => setOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
