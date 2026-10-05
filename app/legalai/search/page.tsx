"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  FileText,
  Briefcase,
  Bot,
  BookOpen,
  Gavel,
  CheckSquare,
  Users,
  Bookmark,
  Sparkles,
  Loader2,
  Filter,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import {
  MOCK_DOCUMENTS,
  MOCK_MATTERS,
  MOCK_CONVERSATIONS,
  MOCK_DRAFTS,
  MOCK_TASKS,
  MALAYSIAN_SOURCES,
  MOCK_SAVED,
  MOCK_NOTIFICATIONS,
} from "@/lib/lawmate/data";
import { relativeTime } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface SearchResult {
  id: string;
  kind: string;
  title: string;
  description?: string;
  href: string;
  icon: LucideIcon;
  group: string;
  relevance: number;
}

const KIND_ICON: Record<string, LucideIcon> = {
  Documents: FileText,
  Matters: Briefcase,
  Conversations: Bot,
  Drafts: Sparkles,
  Tasks: CheckSquare,
  "Legal Sources": Gavel,
  Saved: Bookmark,
  Notifications: Users,
  Clients: Users,
};

function fuzzyMatch(haystack: string, needle: string): number {
  if (!needle) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 100;
  if (h.startsWith(n)) return 90;
  if (h.includes(n)) return 70;
  let hi = 0;
  let matched = 0;
  for (let i = 0; i < n.length; i++) {
    const ch = n[i]!;
    const idx = h.indexOf(ch, hi);
    if (idx === -1) return 0;
    matched++;
    hi = idx + 1;
  }
  return Math.round((matched / n.length) * 40);
}

function buildIndex(query: string): SearchResult[] {
  if (!query.trim()) return [];
  const results: SearchResult[] = [];

  MOCK_DOCUMENTS.forEach((d) => {
    const score = fuzzyMatch(d.name + " " + d.classification, query);
    if (score > 0)
      results.push({
        id: `doc-${d.id}`,
        kind: "Documents",
        title: d.name,
        description: `${d.classification} · ${d.pageCount ?? 0} pages`,
        href: "/legalai/documents",
        icon: FileText,
        group: "Documents",
        relevance: score,
      });
  });
  MOCK_MATTERS.forEach((m) => {
    const score = fuzzyMatch(m.name + " " + (m.client ?? "") + " " + m.area + " " + (m.number ?? ""), query);
    if (score > 0)
      results.push({
        id: `m-${m.id}`,
        kind: "Matters",
        title: m.name,
        description: `${m.client ?? "—"} · ${m.area}`,
        href: "/legalai/matters",
        icon: Briefcase,
        group: "Matters",
        relevance: score,
      });
  });
  MOCK_CONVERSATIONS.forEach((c) => {
    const score = fuzzyMatch(c.title + " " + (c.preview ?? ""), query);
    if (score > 0)
      results.push({
        id: `c-${c.id}`,
        kind: "Conversations",
        title: c.title,
        description: c.preview,
        href: "/legalai/assistant",
        icon: Bot,
        group: "Conversations",
        relevance: score,
      });
  });
  MOCK_DRAFTS.forEach((d) => {
    const score = fuzzyMatch(d.title, query);
    if (score > 0)
      results.push({
        id: `d-${d.id}`,
        kind: "Drafts",
        title: d.title,
        description: d.status,
        href: "/legalai/draft",
        icon: Sparkles,
        group: "Drafts",
        relevance: score,
      });
  });
  MOCK_TASKS.forEach((t) => {
    const score = fuzzyMatch(t.title + " " + (t.matterName ?? ""), query);
    if (score > 0)
      results.push({
        id: `t-${t.id}`,
        kind: "Tasks",
        title: t.title,
        description: t.matterName,
        href: "/legalai/tasks",
        icon: CheckSquare,
        group: "Tasks",
        relevance: score,
      });
  });
  MALAYSIAN_SOURCES.forEach((s) => {
    const score = fuzzyMatch(s.title + " " + (s.section ?? "") + " " + s.area, query);
    if (score > 0)
      results.push({
        id: `s-${s.id}`,
        kind: "Legal Sources",
        title: s.title,
        description: `${s.type} · ${s.section ?? ""} · ${s.area}`,
        href: "/legalai/research",
        icon: s.type === "case" ? Gavel : BookOpen,
        group: "Legal Sources",
        relevance: score,
      });
  });
  MOCK_SAVED.forEach((s) => {
    const score = fuzzyMatch(s.title + " " + (s.tags ?? []).join(" "), query);
    if (score > 0)
      results.push({
        id: `sv-${s.id}`,
        kind: "Saved",
        title: s.title,
        description: (s.tags ?? []).join(", "),
        href: "/legalai/saved",
        icon: Bookmark,
        group: "Saved",
        relevance: score,
      });
  });

  return results.sort((a, b) => b.relevance - a.relevance);
}

const SUGGESTED = ["Employment Act 1955", "PDPA cross-border", "non-compete clause", "salary deduction", "warning letter"];

export default function UniversalSearchPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const results = useMemo(() => buildIndex(query), [query]);

  const grouped = useMemo(() => {
    const g: Record<string, SearchResult[]> = {};
    results.forEach((r) => {
      if (activeFilter !== "all" && r.kind !== activeFilter) return;
      const list = g[r.group] ?? (g[r.group] = []);
      list.push(r);
    });
    return g;
  }, [results, activeFilter]);

  const filterOptions = ["all", "Documents", "Matters", "Conversations", "Tasks", "Legal Sources", "Drafts", "Saved"];

  const handleSearch = (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setSearching(true);
    setTimeout(() => setSearching(false), 300);
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Universal Search</h1>
          <p className="text-sm text-muted-foreground">
            Search across documents, matters, conversations, tasks, legal sources and saved items.
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3.5 size-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch(query)}
                placeholder="Search everything…"
                className="pl-10 h-11 text-sm"
                autoFocus
              />
              {searching && (
                <Loader2 className="absolute right-3 top-3.5 size-4 animate-spin text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="size-3 text-muted-foreground" />
              {filterOptions.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] capitalize transition-colors",
                    activeFilter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {!query.trim() && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Try searching for</CardTitle>
              <CardDescription>Common legal topics and recent queries.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSearch(s)}
                    className="rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-accent transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <HintCard
                  icon={FileText}
                  title="Documents"
                  desc="Find uploaded files by name, content or classification."
                />
                <HintCard
                  icon={Gavel}
                  title="Legal Sources"
                  desc="Search Malaysian statutes, cases and guidelines."
                />
                <HintCard
                  icon={Briefcase}
                  title="Matters"
                  desc="Locate matters by name, client or number."
                />
                <HintCard
                  icon={Bot}
                  title="Conversations"
                  desc="Search your AI conversation history."
                />
              </div>
            </CardContent>
          </Card>
        )}

        {query.trim() && results.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Search className="size-8 text-muted-foreground opacity-40 mb-3" />
              <p className="font-medium">No results found</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                We couldn&rsquo;t find anything matching &ldquo;{query}&rdquo;. Try different keywords or check the filters.
              </p>
            </CardContent>
          </Card>
        )}

        {Object.entries(grouped).map(([group, items]) => (
          <div key={group} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {group} ({items.length})
            </h3>
            <div className="space-y-2">
              {items.slice(0, 6).map((r) => {
                const Icon = r.icon;
                return (
                  <Link
                    key={r.id}
                    href={r.href}
                    className="flex items-start gap-3 rounded-md border bg-card p-3 hover:border-primary/30 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm leading-tight truncate">{r.title}</p>
                      {r.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {r.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px]">
                        {r.relevance}%
                      </Badge>
                      <ArrowRight className="size-3 text-muted-foreground" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}

function HintCard({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc: string }) {
  return (
    <div className="rounded-md border bg-card/50 p-3">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="size-3.5 text-primary" />
        <p className="text-sm font-medium">{title}</p>
      </div>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}
