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
      { href: "/legalai/automations", label: "Automations", icon: Sparkles, matchPrefix: "/legalai/automations", description: "Workflow automations" },
    ],
  },
  {
    label: "AI & Research",
    defaultOpen: true,
    items: [
      { href: "/legalai/assistant", label: "AI Assistant", icon: Bot, matchPrefix: "/legalai/assistant", description: "Conversational legal AI" },
      { href: "/legalai/research", label: "Legal Research", icon: BookOpen, matchPrefix: "/legalai/research", description: "Evidence-grounded legal research" },
      { href: "/legalai/agents", label: "AI Agents", icon: Scale, matchPrefix: "/legalai/agents", description: "Agent swarm management" },
      { href: "/legalai/debate", label: "Debate", icon: Swords, matchPrefix: "/legalai/debate", description: "Multi-agent debate simulation" },
      { href: "/legalai/analysis", label: "Analysis", icon: BarChart3, matchPrefix: "/legalai/analysis", description: "Document analysis" },
      { href: "/legalai/risk", label: "Risk", icon: AlertTriangle, matchPrefix: "/legalai/risk", description: "Risk engine" },
      { href: "/legalai/search", label: "Search", icon: Search, matchPrefix: "/legalai/search", description: "Universal search" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/legalai/hitl", label: "Agent Control (HITL)", icon: Gavel, matchPrefix: "/legalai/hitl", badge: "HITL", description: "Human-in-the-loop approvals" },
      { href: "/legalai/saved", label: "Saved", icon: Shield, matchPrefix: "/legalai/saved", description: "Saved items" },
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
  { id: "nav-research", label: "Go to Legal Research", group: "Navigate", icon: BookOpen, href: "/legalai/research", keywords: ["research", "law", "cases"] },
  { id: "nav-agents", label: "Go to AI Agents", group: "Navigate", icon: Scale, href: "/legalai/agents", keywords: ["agents", "swarm"] },
  { id: "nav-debate", label: "Go to Debate", group: "Navigate", icon: Swords, href: "/legalai/debate", keywords: ["debate", "simulation"] },
  { id: "nav-automations", label: "Go to Automations", group: "Navigate", icon: Sparkles, href: "/legalai/automations", keywords: ["workflows", "automation"] },
  { id: "nav-risk", label: "Go to Risk", group: "Navigate", icon: AlertTriangle, href: "/legalai/risk", keywords: ["risk", "alerts"] },
  { id: "nav-search", label: "Go to Search", group: "Navigate", icon: Search, href: "/legalai/search", keywords: ["find", "query"] },
  { id: "nav-hitl", label: "Go to Agent Control", group: "Navigate", icon: Gavel, href: "/legalai/hitl", keywords: ["approvals", "hitl"] },
  { id: "nav-saved", label: "Go to Saved", group: "Navigate", icon: Shield, href: "/legalai/saved", keywords: ["bookmarks", "saved"] },
  { id: "nav-settings", label: "Go to Settings", group: "Navigate", icon: Settings, href: "/legalai/settings", keywords: ["preferences", "config"] },
  { id: "action-ask", label: "Ask LawMate", group: "Actions", icon: Bot, action: "openAsk", shortcut: "A", keywords: ["question", "chat"] },
  { id: "action-create-matter", label: "Create New Matter", group: "Actions", icon: Briefcase, action: "openCreateMatter", shortcut: "M", keywords: ["new", "matter"] },
];

export function isItemActive(pathname: string, item: NavChild): boolean {
  if (item.href === "/legalai") return pathname === "/legalai";
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + "/");
  return pathname === item.href;
}