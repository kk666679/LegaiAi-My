// components/automation/nodes/node-icons.ts
import {
  Activity,
  Bot,
  Database,
  FileJson,
  FileText,
  Filter,
  GitBranch,
  Inbox,
  MessageSquareText,
  Shield,
  UserRound,
  Webhook,
  Zap,
} from "lucide-react";
import type { NodeAccent, NodeIconKey } from "../types";

export const NODE_ICONS: Record<NodeIconKey, React.ComponentType<{ className?: string; size?: number }>> = {
  inbox: Inbox,
  bot: Bot,
  branch: GitBranch,
  message: MessageSquareText,
  clock: Activity,
  file: FileText,
  filter: Filter,
  user: UserRound,
  shield: Shield,
  zap: Zap,
  webhook: Webhook,
  database: Database,
};

export const FALLBACK_ICON = FileJson;

export const ACCENT_BG: Record<NodeAccent, string> = {
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  pink: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  slate: "bg-slate-500/10 text-slate-600 dark:text-slate-400",
};

export const ACCENT_BORDER: Record<NodeAccent, string> = {
  violet: "border-violet-500/60",
  blue: "border-blue-500/60",
  amber: "border-amber-500/60",
  green: "border-emerald-500/60",
  cyan: "border-cyan-500/60",
  pink: "border-pink-500/60",
  red: "border-red-500/60",
  slate: "border-slate-500/60",
};
