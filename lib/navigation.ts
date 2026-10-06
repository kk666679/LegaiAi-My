import {
  LayoutDashboard,
  Bot,
  Search,
  BookOpen,
  FileText,
  Briefcase,
  FileSignature,
  AlertTriangle,
  History,
  Bell,
  Settings,
  Scale,
  Sparkles,
  Shield,
  Users,
  Swords,
  BarChart3,
  Gavel,
  FileCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavChild {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  matchPrefix?: string;
  description?: string;
}

export interface NavGroup {
  label: string;
  items: NavChild[];
  defaultOpen?: boolean;
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    defaultOpen: true,
    items: [
      { href: "/legalai", label: "Dashboard", icon: LayoutDashboard, matchPrefix: "/legalai", description: "Workspace overview" },
      { href: "/legalai/matters", label: "Matters", icon: Briefcase, matchPrefix: "/legalai/matters", description: "Manage legal matters" },
      { href: "/legalai/documents", label: "Documents", icon: FileText, matchPrefix: "/legalai/documents", description: "Document library" },
      { href: "/legalai/contracts", label: "Contracts", icon: FileCheck, matchPrefix: "/legalai/contracts", description: "Contract review & management" },
    ],
  },
  {
    label: "AI & Research",
    defaultOpen: true,
    items: [
      { href: "/legalai/assistant", label: "AI Assistant", icon: Bot, matchPrefix: "/legalai/assistant", description: "Conversational legal AI" },
      { href: "/legalai/debate", label: "Debate & Research", icon: Swords, matchPrefix: "/legalai/debate", description: "Multi-agent debate & legal research" },
      { href: "/legalai/search", label: "Search", icon: Search, matchPrefix: "/legalai/search", description: "Universal search" },
      { href: "/legalai/monitor", label: "Monitor", icon: Bell, matchPrefix: "/legalai/monitor", description: "Regulatory change monitoring" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/legalai/hitl", label: "Agent Control (HITL)", icon: Gavel, matchPrefix: "/legalai/hitl", badge: "HITL", description: "Human-in-the-loop approvals" },
      { href: "/legalai/analytics", label: "Analytics", icon: BarChart3, matchPrefix: "/legalai/analytics", description: "Usage & performance analytics" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/legalai/settings", label: "Settings", icon: Settings, matchPrefix: "/legalai/settings", description: "Workspace settings" },
    ],
  },
];

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon: LucideIcon;
  href?: string;
  action?: string;
  shortcut?: string;
  description?: string;
  keywords?: string[];
}

export const COMMAND_ITEMS: CommandItem[] = [
  { id: "nav-dashboard", label: "Go to Dashboard", group: "Navigate", icon: LayoutDashboard, href: "/legalai", keywords: ["home", "overview"] },
  { id: "nav-matters", label: "Go to Matters", group: "Navigate", icon: Briefcase, href: "/legalai/matters", keywords: ["cases", "matters"] },
  { id: "nav-documents", label: "Go to Documents", group: "Navigate", icon: FileText, href: "/legalai/documents", keywords: ["files", "library"] },
  { id: "nav-contracts", label: "Go to Contracts", group: "Navigate", icon: FileCheck, href: "/legalai/contracts", keywords: ["agreements"] },
  { id: "nav-assistant", label: "Go to AI Assistant", group: "Navigate", icon: Bot, href: "/legalai/assistant", keywords: ["chat", "ai"] },
  { id: "nav-debate", label: "Go to Debate & Research", group: "Navigate", icon: Swords, href: "/legalai/debate", keywords: ["research", "agents"] },
  { id: "nav-search", label: "Go to Search", group: "Navigate", icon: Search, href: "/legalai/search", keywords: ["find", "query"] },
  { id: "nav-hitl", label: "Go to Agent Control", group: "Navigate", icon: Gavel, href: "/legalai/hitl", keywords: ["approvals", "hitl"] },
  { id: "nav-settings", label: "Go to Settings", group: "Navigate", icon: Settings, href: "/legalai/settings", keywords: ["preferences", "config"] },
  { id: "action-ask", label: "Ask LawMate", group: "Actions", icon: Bot, action: "openAsk", shortcut: "A", keywords: ["question", "chat"] },
  { id: "action-create-matter", label: "Create New Matter", group: "Actions", icon: Briefcase, action: "openCreateMatter", shortcut: "M", keywords: ["new", "matter"] },
];

export function isItemActive(pathname: string, item: NavChild): boolean {
  if (item.href === "/legalai") return pathname === "/legalai";
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + "/");
  return pathname === item.href;
}