"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bot,
  Upload,
  Briefcase,
  Plus,
  BookOpen,
  FileSignature,
  LayoutDashboard,
  Settings,
  FileText,
  History,
  ArrowRight,
  Globe,
  Gavel,
  CheckSquare,
  Users,
  Shield,
  AlertTriangle,
  Bookmark,
  Bell,
  BarChart3,
  Eye,
  Sparkles,
  Loader2,
  Command as CommandIcon,
  type LucideIcon,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";
import {
  MOCK_DOCUMENTS,
  MOCK_MATTERS,
  MOCK_CONVERSATIONS,
  MOCK_DRAFTS,
  MOCK_TASKS,
  MOCK_NOTIFICATIONS,
  MALAYSIAN_SOURCES,
  MOCK_SAVED,
} from "@/lib/lawmate/data";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface SearchHit {
  id: string;
  kind: string;
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  score: number;
}

const NAV = [
  { label: "Go to Dashboard", href: "/legalai", icon: LayoutDashboard, keywords: ["home", "overview"] },
  { label: "Go to AI Assistant", href: "/legalai/assistant", icon: Bot, keywords: ["chat", "ai", "copilot"] },
  { label: "Go to AI Copilot", href: "/legalai/agent", icon: Sparkles, keywords: ["agent"] },
  { label: "Go to Research", href: "/legalai/research", icon: BookOpen, keywords: ["law", "cases", "statutes"] },
  { label: "Go to Universal Search", href: "/legalai/search", icon: Search, keywords: ["find", "query"] },
  { label: "Go to Documents", href: "/legalai/documents", icon: FileText, keywords: ["files", "library"] },
  { label: "Go to Drafting", href: "/legalai/draft", icon: FileSignature, keywords: ["draft", "create", "write"] },
  { label: "Go to Contracts", href: "/legalai/contracts", icon: FileSignature, keywords: ["agreements"] },
  { label: "Go to Matters", href: "/legalai/matters", icon: Briefcase, keywords: ["cases", "matters"] },
  { label: "Go to Clients", href: "/legalai/clients", icon: Users, keywords: ["parties", "contacts"] },
  { label: "Go to Tasks", href: "/legalai/tasks", icon: CheckSquare, keywords: ["todo", "checklist"] },
  { label: "Go to Risk Engine", href: "/legalai/risk", icon: AlertTriangle, keywords: ["danger", "compliance"] },
  { label: "Go to Settings", href: "/legalai/settings", icon: Settings, keywords: ["preferences", "config"] },
  { label: "Go to Notifications", href: "/legalai/notifications", icon: Bell, keywords: ["alerts"] },
  { label: "Go to Saved Items", href: "/legalai/saved", icon: Bookmark, keywords: ["bookmarks"] },
  { label: "Go to Activity History", href: "/legalai/history", icon: History, keywords: ["log", "timeline"] },
  { label: "Go to Audit Trail", href: "/legalai/audit", icon: Shield, keywords: ["logs", "governance"] },
  { label: "Go to Analytics", href: "/legalai/analytics", icon: BarChart3, keywords: ["stats", "metrics"] },
];

const ACTIONS = [
  { label: "Ask LawMate", href: "/legalai/assistant", icon: Bot, shortcut: "A", action: "ask" },
  { label: "Upload document", href: "/legalai/documents", icon: Upload, shortcut: "U", action: "upload" },
  { label: "Create matter", href: "/legalai/matters", icon: Briefcase, shortcut: "M", action: "matter" },
  { label: "Create task", href: "/legalai/tasks", icon: Plus, shortcut: "T", action: "task" },
  { label: "Start new draft", href: "/legalai/draft", icon: FileSignature, shortcut: "D", action: "draft" },
  { label: "Search legislation", href: "/legalai/research", icon: Globe, shortcut: "L", action: "research" },
  { label: "Run legal analysis", href: "/legalai/analysis", icon: Sparkles, shortcut: "N", action: "analyse" },
  { label: "AI review", href: "/legalai/assistant", icon: Eye, shortcut: "R", action: "review" },
  { label: "View risk dashboard", href: "/legalai/risk", icon: AlertTriangle, shortcut: "K", action: "risk" },
];

function fuzzyMatch(haystack: string, needle: string): number {
  if (!needle) return 1;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h.includes(n)) return 2;
  let hi = 0;
  for (let i = 0; i < n.length; i++) {
    const ch = n[i]!;
    const idx = h.indexOf(ch, hi);
    if (idx === -1) return 0;
    hi = idx + 1;
  }
  return 1;
}

function buildSearchIndex(query: string): SearchHit[] {
  if (!query.trim()) return [];
  const hits: SearchHit[] = [];

  MOCK_DOCUMENTS.forEach((d) => {
    const score = fuzzyMatch(d.name, query);
    if (score > 0) {
      hits.push({
        id: `doc-${d.id}`,
        kind: "Documents",
        title: d.name,
        description: d.classification,
        href: "/legalai/documents",
        icon: FileText,
        score: score * 10,
      });
    }
  });

  MOCK_MATTERS.forEach((m) => {
    const score = fuzzyMatch(m.name + " " + (m.client ?? "") + " " + (m.number ?? ""), query);
    if (score > 0) {
      hits.push({
        id: `matter-${m.id}`,
        kind: "Matters",
        title: m.name,
        description: `${m.client ?? "—"} · ${m.area}`,
        href: "/legalai/matters",
        icon: Briefcase,
        score: score * 9,
      });
    }
  });

  MOCK_CONVERSATIONS.forEach((c) => {
    const score = fuzzyMatch(c.title + " " + (c.preview ?? ""), query);
    if (score > 0) {
      hits.push({
        id: `conv-${c.id}`,
        kind: "Conversations",
        title: c.title,
        description: c.preview,
        href: "/legalai/assistant",
        icon: Bot,
        score: score * 8,
      });
    }
  });

  MOCK_DRAFTS.forEach((d) => {
    const score = fuzzyMatch(d.title, query);
    if (score > 0) {
      hits.push({
        id: `draft-${d.id}`,
        kind: "Drafts",
        title: d.title,
        description: d.status,
        href: "/legalai/draft",
        icon: FileSignature,
        score: score * 8,
      });
    }
  });

  MOCK_TASKS.forEach((t) => {
    const score = fuzzyMatch(t.title + " " + (t.matterName ?? ""), query);
    if (score > 0) {
      hits.push({
        id: `task-${t.id}`,
        kind: "Tasks",
        title: t.title,
        description: t.matterName,
        href: "/legalai/tasks",
        icon: CheckSquare,
        score: score * 7,
      });
    }
  });

  MALAYSIAN_SOURCES.forEach((s) => {
    const score = fuzzyMatch(s.title + " " + (s.section ?? "") + " " + s.area, query);
    if (score > 0) {
      hits.push({
        id: `src-${s.id}`,
        kind: "Legal Sources",
        title: s.title,
        description: `${s.type} · ${s.section ?? ""} · ${s.area}`,
        href: "/legalai/research",
        icon: s.type === "case" ? Gavel : BookOpen,
        score: score * 6,
      });
    }
  });

  MOCK_SAVED.forEach((s) => {
    const score = fuzzyMatch(s.title, query);
    if (score > 0) {
      hits.push({
        id: `saved-${s.id}`,
        kind: "Saved",
        title: s.title,
        description: (s.tags ?? []).join(", "),
        href: "/legalai/saved",
        icon: Bookmark,
        score: score * 5,
      });
    }
  });

  return hits.sort((a, b) => b.score - a.score).slice(0, 12);
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const searchHits = useMemo(() => buildSearchIndex(query), [query]);

  const filteredNav = useMemo(() => {
    if (!query.trim()) return NAV;
    const q = query.toLowerCase();
    return NAV.filter(
      (n) =>
        n.label.toLowerCase().includes(q) ||
        (n.keywords ?? []).some((k) => k.includes(q)),
    );
  }, [query]);

  const filteredActions = useMemo(() => {
    if (!query.trim()) return ACTIONS;
    const q = query.toLowerCase();
    return ACTIONS.filter((a) => a.label.toLowerCase().includes(q));
  }, [query]);

  const run = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const hasResults =
    searchHits.length > 0 || filteredNav.length > 0 || filteredActions.length > 0;

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder="Search LawMate, run a command, or jump to a page…"
      />
      <CommandList>
        {!hasResults && query.trim() ? (
          <CommandEmpty>
            <div className="flex flex-col items-center gap-2 py-6 text-sm text-muted-foreground">
              <Search className="size-5 opacity-50" />
              <span>No results for &ldquo;{query}&rdquo;</span>
              <span className="text-[11px]">Try a different search term</span>
            </div>
          </CommandEmpty>
        ) : null}

        {!query.trim() && (
          <CommandGroup heading="Quick actions">
            {ACTIONS.slice(0, 6).map((a) => {
              const Icon = a.icon;
              return (
                <CommandItem key={a.label} onSelect={() => run(a.href)}>
                  <Icon className="size-4" />
                  <span>{a.label}</span>
                  {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {searchHits.length > 0 && (
          <CommandGroup heading="Results">
            {searchHits.map((hit) => {
              const Icon = hit.icon;
              return (
                <CommandItem key={hit.id} onSelect={() => run(hit.href)} value={hit.title}>
                  <Icon className="size-4" />
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{hit.title}</span>
                    {hit.description && (
                      <span className="text-[10px] text-muted-foreground truncate">
                        {hit.description}
                      </span>
                    )}
                  </div>
                  <Badge className="ml-auto text-[10px]" variant="secondary">
                    {hit.kind}
                  </Badge>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {filteredActions.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Actions">
              {filteredActions.map((a) => {
                const Icon = a.icon;
                return (
                  <CommandItem key={a.label} onSelect={() => run(a.href)}>
                    <Icon className="size-4" />
                    <span>{a.label}</span>
                    {a.shortcut && <CommandShortcut>{a.shortcut}</CommandShortcut>}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {filteredNav.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Navigate">
              {filteredNav.map((n) => {
                const Icon = n.icon;
                return (
                  <CommandItem key={n.href} onSelect={() => run(n.href)}>
                    <Icon className="size-4" />
                    <span>{n.label}</span>
                    <ArrowRight className="ml-auto size-3 text-muted-foreground" />
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t px-3 py-2 text-[10px] text-muted-foreground">
        <div className="flex items-center gap-2">
          <Kbd>↑</Kbd>
          <Kbd>↓</Kbd>
          <span>navigate</span>
          <Kbd>↵</Kbd>
          <span>select</span>
          <Kbd>esc</Kbd>
          <span>close</span>
        </div>
        <div className="flex items-center gap-1">
          <CommandIcon className="size-3" />
          <span>LawMate</span>
        </div>
      </div>
    </CommandDialog>
  );
}
