"use client";

import { toast } from "sonner";
import {
  Bookmark,
  FileText,
  Bot,
  BookOpen,
  FileSignature,
  Search,
  ExternalLink,
  Tag,
  Calendar,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MOCK_SAVED } from "@/lib/lawmate/data";
import { relativeTime } from "@/lib/lawmate/utils";
import { useState } from "react";

const KIND_ICON: Record<string, any> = {
  source: BookOpen,
  answer: Bot,
  clause: FileSignature,
  research: FileText,
};

const KIND_BADGE: Record<string, string> = {
  source: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  answer: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  clause: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  research: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const KIND_HREF = (kind: string): string => {
  switch (kind) {
    case "source":
      return "/legalai/research";
    case "answer":
      return "/legalai/assistant";
    case "clause":
      return "/legalai/drafting";
    case "research":
      return "/legalai/research";
    default:
      return "/legalai";
  }
};

export default function SavedPage() {
  const [search, setSearch] = useState("");
  const filtered = MOCK_SAVED.filter((s) =>
    !search || s.title.toLowerCase().includes(search.toLowerCase()) || (s.tags ?? []).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Bookmark className="size-5 text-primary" />
            Saved Items
          </h1>
          <p className="text-sm text-muted-foreground">
            Your bookmarked research, clauses, answers and authorities.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search saved items…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bookmark className="size-8 text-muted-foreground opacity-40 mb-3" />
                <p className="font-medium">No saved items yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Bookmark sources, clauses, and answers while researching or drafting to find them here.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((s) => {
                  const Icon = KIND_ICON[s.kind] ?? Bookmark;
                  return (
                    <div
                      key={s.id}
                      className="flex items-start gap-3 rounded-md border bg-card/30 p-3 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{s.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${KIND_BADGE[s.kind]}`}>
                            {s.kind}
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.body}</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-[11px] text-muted-foreground">
                          {(s.tags ?? []).map((t) => (
                            <span key={t} className="inline-flex items-center gap-0.5 rounded-full border bg-muted/50 px-1.5 py-0.5">
                              <Tag className="size-2.5" /> {t}
                            </span>
                          ))}
                          <span className="ml-auto inline-flex items-center gap-1">
                            <Calendar className="size-2.5" /> {relativeTime(s.savedAt)}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Open"
                        onClick={() => {
                          const href = KIND_HREF(s.kind);
                          toast.message(`Opening "${s.title}"`, { description: `Routes to ${href}` });
                          window.location.href = href;
                        }}
                      >
                        <ExternalLink className="size-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
