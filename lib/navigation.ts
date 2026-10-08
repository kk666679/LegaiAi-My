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
      { href: "/lawmate", label: "Dashboard", icon: LayoutDashboard, matchPrefix: "/lawmate", description: "Workspace overview" },
      { href: "/lawmate/matters", label: "Matters", icon: Briefcase, matchPrefix: "/lawmate/matters", description: "Manage legal matters" },
      { href: "/lawmate/documents", label: "Documents", icon: FileText, matchPrefix: "/lawmate/documents", description: "Document library" },
      { href: "/lawmate/contracts", label: "Contracts", icon: FileCheck, matchPrefix: "/lawmate/contracts", description: "Contract review & management" },
      { href: "/lawmate/automations", label: "Automations", icon: Sparkles, matchPrefix: "/lawmate/automations", description: "Workflow automations" },
    ],
  },
  {
    label: "AI & Research",
    defaultOpen: true,
    items: [
      { href: "/lawmate/assistant", label: "AI Assistant", icon: Bot, matchPrefix: "/lawmate/assistant", description: "Conversational legal AI" },
      { href: "/lawmate/research", label: "Legal Research", icon: BookOpen, matchPrefix: "/lawmate/research", description: "Evidence-grounded legal research" },
      { href: "/lawmate/agents", label: "AI Agents", icon: Scale, matchPrefix: "/lawmate/agents", description: "Agent swarm management" },
      { href: "/lawmate/debate", label: "Debate", icon: Swords, matchPrefix: "/lawmate/debate", description: "Multi-agent debate simulation" },
      { href: "/lawmate/analysis", label: "Analysis", icon: BarChart3, matchPrefix: "/lawmate/analysis", description: "Document analysis" },
      { href: "/lawmate/risk", label: "Risk", icon: AlertTriangle, matchPrefix: "/lawmate/risk", description: "Risk engine" },
      { href: "/lawmate/search", label: "Search", icon: Search, matchPrefix: "/lawmate/search", description: "Universal search" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/lawmate/hitl", label: "Agent Control (HITL)", icon: Gavel, matchPrefix: "/lawmate/hitl", badge: "HITL", description: "Human-in-the-loop approvals" },
      { href: "/lawmate/saved", label: "Saved", icon: Shield, matchPrefix: "/lawmate/saved", description: "Saved items" },
    ],
  },
  {
    label: "Settings",
    items: [
      { href: "/lawmate/settings", label: "Settings", icon: Settings, matchPrefix: "/lawmate/settings", description: "Workspace settings" },
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
  { id: "nav-dashboard", label: "Go to Dashboard", group: "Navigate", icon: LayoutDashboard, href: "/lawmate", keywords: ["home", "overview"] },
  { id: "nav-matters", label: "Go to Matters", group: "Navigate", icon: Briefcase, href: "/lawmate/matters", keywords: ["cases", "matters"] },
  { id: "nav-documents", label: "Go to Documents", group: "Navigate", icon: FileText, href: "/lawmate/documents", keywords: ["files", "library"] },
  { id: "nav-contracts", label: "Go to Contracts", group: "Navigate", icon: FileCheck, href: "/lawmate/contracts", keywords: ["agreements"] },
  { id: "nav-assistant", label: "Go to AI Assistant", group: "Navigate", icon: Bot, href: "/lawmate/assistant", keywords: ["chat", "ai"] },
  { id: "nav-research", label: "Go to Legal Research", group: "Navigate", icon: BookOpen, href: "/lawmate/research", keywords: ["research", "law", "cases"] },
  { id: "nav-agents", label: "Go to AI Agents", group: "Navigate", icon: Scale, href: "/lawmate/agents", keywords: ["agents", "swarm"] },
  { id: "nav-debate", label: "Go to Debate", group: "Navigate", icon: Swords, href: "/lawmate/debate", keywords: ["debate", "simulation"] },
  { id: "nav-automations", label: "Go to Automations", group: "Navigate", icon: Sparkles, href: "/lawmate/automations", keywords: ["workflows", "automation"] },
  { id: "nav-risk", label: "Go to Risk", group: "Navigate", icon: AlertTriangle, href: "/lawmate/risk", keywords: ["risk", "alerts"] },
  { id: "nav-search", label: "Go to Search", group: "Navigate", icon: Search, href: "/lawmate/search", keywords: ["find", "query"] },
  { id: "nav-hitl", label: "Go to Agent Control", group: "Navigate", icon: Gavel, href: "/lawmate/hitl", keywords: ["approvals", "hitl"] },
  { id: "nav-saved", label: "Go to Saved", group: "Navigate", icon: Shield, href: "/lawmate/saved", keywords: ["bookmarks", "saved"] },
  { id: "nav-settings", label: "Go to Settings", group: "Navigate", icon: Settings, href: "/lawmate/settings", keywords: ["preferences", "config"] },
  { id: "action-ask", label: "Ask LawMate", group: "Actions", icon: Bot, action: "openAsk", shortcut: "A", keywords: ["question", "chat"] },
  { id: "action-create-matter", label: "Create New Matter", group: "Actions", icon: Briefcase, action: "openCreateMatter", shortcut: "M", keywords: ["new", "matter"] },
];

export function isItemActive(pathname: string, item: NavChild): boolean {
  if (item.href === "/lawmate") return pathname === "/lawmate";
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + "/");
  return pathname === item.href;
}