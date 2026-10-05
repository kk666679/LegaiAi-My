import {
  LayoutDashboard,
  Bot,
  Search,
  BookOpen,
  FileText,
  Briefcase,
  CheckSquare,
  FileSignature,
  AlertTriangle,
  History,
  Bookmark,
  Bell,
  Settings,
  Scale,
  Sparkles,
  Shield,
  Users,
  Swords,
  ClipboardList,
  Eye,
  Cpu,
  BarChart3,
  Activity,
  Gavel,
  FileCheck,
  GitCompare,
  Download,
  Library,
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
      { href: "/legalai/saved", label: "Saved Items", icon: Bookmark, matchPrefix: "/legalai/saved", description: "Bookmarked research, clauses & answers" },
      { href: "/legalai/history", label: "Activity History", icon: History, matchPrefix: "/legalai/history", description: "Your recent AI activity" },
    ],
  },
  {
    label: "Matters & Cases",
    defaultOpen: true,
    items: [
      { href: "/legalai/matters", label: "Matters", icon: Briefcase, matchPrefix: "/legalai/matters", description: "Manage legal matters" },
      { href: "/legalai/clients", label: "Clients", icon: Users, matchPrefix: "/legalai/clients", description: "Client & party management" },
      { href: "/legalai/tasks", label: "Tasks", icon: CheckSquare, matchPrefix: "/legalai/tasks", description: "Task tracking & assignments" },
    ],
  },
  {
    label: "Documents",
    defaultOpen: true,
    items: [
      { href: "/legalai/documents", label: "Documents", icon: FileText, matchPrefix: "/legalai/documents", description: "Document library" },
      { href: "/legalai/draft", label: "Document Drafting", icon: FileSignature, matchPrefix: "/legalai/draft", description: "AI-powered drafting workspace" },
      { href: "/legalai/draft", label: "Drafting Studio", icon: Sparkles, matchPrefix: "/legalai/draft", description: "Advanced drafting tools" },
      { href: "/legalai/contracts", label: "Contracts", icon: FileCheck, matchPrefix: "/legalai/contracts", description: "Contract review & management" },
      { href: "/legalai/analysis", label: "Document Analysis", icon: Sparkles, matchPrefix: "/legalai/analysis", description: "AI-powered document analysis" },
      { href: "/legalai/docs", label: "Documentation", icon: Library, matchPrefix: "/legalai/docs", description: "Product documentation" },
    ],
  },
  {
    label: "Legal Research",
    defaultOpen: true,
    items: [
      { href: "/legalai/research", label: "Research", icon: BookOpen, matchPrefix: "/legalai/research", description: "Legal research & sources" },
      { href: "/legalai/search", label: "Universal Search", icon: Search, matchPrefix: "/legalai/search", description: "Search across all data" },
      { href: "/legalai/insights", label: "Insights & Timeline", icon: ClipboardList, matchPrefix: "/legalai/insights", description: "Timeline & case insights" },
    ],
  },
  {
    label: "Risk & Intelligence",
    items: [
      { href: "/legalai/risk", label: "Risk Engine", icon: AlertTriangle, matchPrefix: "/legalai/risk", description: "AI risk analysis" },
      { href: "/legalai/monitor", label: "Change Monitor", icon: Bell, matchPrefix: "/legalai/monitor", description: "Monitor regulatory changes" },
      { href: "/legalai/analytics", label: "Executive Analytics", icon: BarChart3, matchPrefix: "/legalai/analytics", description: "Performance & usage analytics" },
    ],
  },
  {
    label: "AI & Agents",
    defaultOpen: true,
    items: [
      { href: "/legalai/assistant", label: "AI Assistant", icon: Bot, matchPrefix: "/legalai/assistant", badge: "AI", description: "Conversational legal AI" },
      { href: "/legalai/agent", label: "AI Copilot", icon: Cpu, matchPrefix: "/legalai/agent", badge: "AI", description: "Autonomous AI agent" },
      { href: "/legalai/debate", label: "Debate Simulation", icon: Swords, matchPrefix: "/legalai/debate", description: "Multi-agent legal debate" },
      { href: "/legalai/hitl", label: "Agent Control (HITL)", icon: Eye, matchPrefix: "/legalai/hitl", badge: "HITL", description: "Human-in-the-loop control" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/legalai/governance", label: "AI Governance", icon: Cpu, matchPrefix: "/legalai/governance", description: "AI policy & controls" },
      { href: "/legalai/compliance", label: "Compliance", icon: Shield, matchPrefix: "/legalai/compliance", description: "Compliance management" },
      { href: "/legalai/audit", label: "Audit Trail", icon: Gavel, matchPrefix: "/legalai/audit", description: "System audit logs" },
      { href: "/legalai/billing", label: "Billing Intelligence", icon: Activity, matchPrefix: "/legalai/billing", description: "Billing & usage" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/legalai/notifications", label: "Notifications", icon: Bell, matchPrefix: "/legalai/notifications", description: "All notifications" },
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
  // Navigation
  { id: "nav-dashboard", label: "Go to Dashboard", group: "Navigate", icon: LayoutDashboard, href: "/legalai", keywords: ["home", "overview"] },
  { id: "nav-assistant", label: "Go to AI Assistant", group: "Navigate", icon: Bot, href: "/legalai/assistant", keywords: ["chat", "ai", "copilot"] },
  { id: "nav-agent", label: "Go to AI Copilot", group: "Navigate", icon: Cpu, href: "/legalai/agent", keywords: ["agent", "autonomous"] },
  { id: "nav-research", label: "Go to Legal Research", group: "Navigate", icon: BookOpen, href: "/legalai/research", keywords: ["law", "cases", "statutes"] },
  { id: "nav-search", label: "Go to Universal Search", group: "Navigate", icon: Search, href: "/legalai/search", keywords: ["find", "query"] },
  { id: "nav-documents", label: "Go to Documents", group: "Navigate", icon: FileText, href: "/legalai/documents", keywords: ["files", "library"] },
  { id: "nav-drafting", label: "Go to Document Drafting", group: "Navigate", icon: FileSignature, href: "/legalai/draft", keywords: ["draft", "create", "write"] },
  { id: "nav-contracts", label: "Go to Contracts", group: "Navigate", icon: FileCheck, href: "/legalai/contracts", keywords: ["agreements"] },
  { id: "nav-matters", label: "Go to Matters", group: "Navigate", icon: Briefcase, href: "/legalai/matters", keywords: ["cases", "matters"] },
  { id: "nav-clients", label: "Go to Clients", group: "Navigate", icon: Users, href: "/legalai/clients", keywords: ["parties", "contacts"] },
  { id: "nav-tasks", label: "Go to Tasks", group: "Navigate", icon: CheckSquare, href: "/legalai/tasks", keywords: ["todo", "checklist"] },
  { id: "nav-risk", label: "Go to Risk Engine", group: "Navigate", icon: AlertTriangle, href: "/legalai/risk", keywords: ["danger", "compliance"] },
  { id: "nav-saved", label: "Go to Saved Items", group: "Navigate", icon: Bookmark, href: "/legalai/saved", keywords: ["bookmarks"] },
  { id: "nav-history", label: "Go to Activity History", group: "Navigate", icon: History, href: "/legalai/history", keywords: ["log", "timeline"] },
  { id: "nav-audit", label: "Go to Audit Trail", group: "Navigate", icon: Gavel, href: "/legalai/audit", keywords: ["logs", "governance"] },
  { id: "nav-governance", label: "Go to AI Governance", group: "Navigate", icon: Cpu, href: "/legalai/governance", keywords: ["policy", "controls"] },
  { id: "nav-compliance", label: "Go to Compliance", group: "Navigate", icon: Shield, href: "/legalai/compliance", keywords: ["regulatory"] },
  { id: "nav-analytics", label: "Go to Executive Analytics", group: "Navigate", icon: BarChart3, href: "/legalai/analytics", keywords: ["stats", "metrics"] },
  { id: "nav-settings", label: "Go to Settings", group: "Navigate", icon: Settings, href: "/legalai/settings", keywords: ["preferences", "config"] },
  { id: "nav-notifications", label: "Go to Notifications", group: "Navigate", icon: Bell, href: "/legalai/notifications", keywords: ["alerts"] },
  // Actions
  { id: "action-ask", label: "Ask LawMate", group: "Actions", icon: Bot, action: "openAsk", shortcut: "A", keywords: ["question", "chat"] },
  { id: "action-upload", label: "Upload Document", group: "Actions", icon: FileText, action: "openUpload", shortcut: "U", keywords: ["add", "import"] },
  { id: "action-create-matter", label: "Create New Matter", group: "Actions", icon: Briefcase, action: "openCreateMatter", shortcut: "M", keywords: ["new", "matter"] },
  { id: "action-create-task", label: "Create New Task", group: "Actions", icon: CheckSquare, action: "openCreateTask", shortcut: "T", keywords: ["new", "task"] },
  { id: "action-new-draft", label: "Start New Draft", group: "Actions", icon: FileSignature, action: "newDraft", shortcut: "D", keywords: ["draft", "document"] },
  { id: "action-toggle-sidebar", label: "Toggle Sidebar", group: "Actions", icon: LayoutDashboard, action: "toggleSidebar", keywords: ["collapse", "expand"] },
  { id: "action-export", label: "Export Current Page", group: "Actions", icon: Download, action: "export", keywords: ["download", "pdf"] },
  // AI Actions
  { id: "ai-validate", label: "Validate Citations", group: "AI Actions", icon: Shield, action: "validateCitations", keywords: ["check", "verify", "citations"] },
  { id: "ai-analyse", label: "Run Legal Analysis", group: "AI Actions", icon: Sparkles, action: "runAnalysis", keywords: ["analyse", "review"] },
  { id: "ai-review", label: "AI Review Document", group: "AI Actions", icon: Eye, action: "aiReview", keywords: ["review", "check"] },
  { id: "ai-compare", label: "Compare Documents", group: "AI Actions", icon: GitCompare, action: "compareDocs", keywords: ["diff", "compare"] },
  { id: "ai-summarise", label: "Generate Summary", group: "AI Actions", icon: FileText, action: "summarise", keywords: ["summary", "tldr"] },
  { id: "ai-translate", label: "Translate Document", group: "AI Actions", icon: Sparkles, action: "translate", keywords: ["language", "translate"] },
];

export function isItemActive(pathname: string, item: NavChild): boolean {
  if (item.href === "/legalai") return pathname === "/legalai";
  if (item.matchPrefix) return pathname === item.matchPrefix || pathname.startsWith(item.matchPrefix + "/");
  return pathname === item.href;
}
