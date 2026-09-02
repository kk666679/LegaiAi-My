"use client";

import {
  History,
  Bot,
  FileText,
  FileSignature,
  Briefcase,
  Activity,
  Gavel,
  BookOpen,
  Filter,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MOCK_ACTIVITY } from "@/lib/lawmate/data";
import { relativeTime } from "@/lib/lawmate/utils";
import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";

const KIND_ICON: Record<string, any> = {
  conversation: Bot,
  document: FileText,
  research: BookOpen,
  draft: FileSignature,
  matter: Briefcase,
  analysis: Activity,
};

const KIND_BADGE: Record<string, string> = {
  conversation: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  document: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  research: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  draft: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  matter: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  analysis: "bg-primary/10 text-primary border-primary/20",
};

export default function HistoryPage() {
  const [filter, setFilter] = useState<string>("all");
  const filtered = MOCK_ACTIVITY.filter((a) => filter === "all" || a.kind === filter);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <History className="size-5 text-primary" />
            Activity History
          </h1>
          <p className="text-sm text-muted-foreground">
            Complete history of your AI-assisted work.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="size-3 text-muted-foreground" />
              {["all", "conversation", "document", "research", "draft", "matter", "analysis"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-[10px] capitalize transition-colors",
                    filter === f
                      ? "bg-primary text-primary-foreground border-primary"
                      : "hover:bg-accent",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History className="size-8 text-muted-foreground opacity-40 mb-3" />
                <p className="font-medium">No history yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your activity will appear here as you work.
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filtered.map((a) => {
                  const Icon = KIND_ICON[a.kind] ?? Activity;
                  return (
                    <Link
                      key={a.id}
                      href={a.href ?? "/legalai"}
                      className="flex items-start gap-3 rounded-md p-2 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium truncate">{a.title}</p>
                          <Badge variant="outline" className={`text-[10px] ${KIND_BADGE[a.kind]}`}>
                            {a.kind}
                          </Badge>
                        </div>
                        {a.detail && (
                          <p className="text-xs text-muted-foreground truncate">{a.detail}</p>
                        )}
                      </div>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-1">
                        {relativeTime(a.at)}
                      </span>
                    </Link>
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
