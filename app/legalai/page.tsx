"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Upload,
  Sparkles,
  FileSignature,
  Search,
  Briefcase,
  ArrowRight,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Gavel,
  BookOpen,
  TrendingUp,
  Activity,
  Layers,
  Plus,
  Eye,
  Calendar,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { CreateMatterDialog } from "@/components/lawmate/CreateMatterDialog";
import { UploadDialog } from "@/components/lawmate/UploadDialog";
import { QuickPromptSheet } from "@/components/lawmate/QuickPromptSheet";
import { MOCK_USER } from "@/lib/lawmate/data";
import {
  MOCK_ACTIVITY,
  MOCK_DASHBOARD_METRICS,
  MOCK_MATTERS,
  MOCK_RISKS,
  MOCK_TASKS,
  MOCK_DOCUMENTS,
  MOCK_CONVERSATIONS,
  MOCK_NOTIFICATIONS,
  PROMPT_SUGGESTIONS,
} from "@/lib/lawmate/data";
import { greeting, relativeTime, severityClasses } from "@/lib/lawmate/utils";
import { cn } from "@/lib/utils";

type QuickActionType = "ask" | "upload" | "analyse" | "draft" | "research" | "matter" | "navigate";

interface QuickAction {
  label: string;
  description: string;
  icon: typeof Bot;
  href: string;
  accent: string;
  type: QuickActionType;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Ask LawMate",
    description: "Open the AI legal assistant",
    icon: Bot,
    href: "/legalai/assistant",
    accent: "bg-primary/10 text-primary",
    type: "ask",
  },
  {
    label: "Upload Document",
    description: "Add a document to your workspace",
    icon: Upload,
    href: "/legalai/documents",
    accent: "bg-blue-500/10 text-blue-500",
    type: "upload",
  },
  {
    label: "Analyse Document",
    description: "Extract clauses, risks & obligations",
    icon: Sparkles,
    href: "/legalai/analysis",
    accent: "bg-violet-500/10 text-violet-500",
    type: "analyse",
  },
  {
    label: "Draft Document",
    description: "Generate a legally-sound draft",
    icon: FileSignature,
    href: "/legalai/drafting",
    accent: "bg-emerald-500/10 text-emerald-500",
    type: "draft",
  },
  {
    label: "Search Law",
    description: "Search Malaysian legal sources",
    icon: Search,
    href: "/legalai/research",
    accent: "bg-amber-500/10 text-amber-500",
    type: "research",
  },
  {
    label: "Create Matter",
    description: "Start a new legal matter",
    icon: Briefcase,
    href: "/legalai/matters",
    accent: "bg-rose-500/10 text-rose-500",
    type: "matter",
  },
];

export default function DashboardHomePage() {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);
  const [askOpen, setAskOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [matterOpen, setMatterOpen] = useState(false);
  const [activityFilter, setActivityFilter] = useState<string>("all");

  useEffect(() => setNow(new Date()), []);

  const m = MOCK_DASHBOARD_METRICS;
  const totalRisks = m.risks.high + m.risks.medium + m.risks.low;
  const riskPct = totalRisks ? Math.round((m.risks.high * 100) / totalRisks) : 0;
  const riskLevel = riskPct >= 40 ? "High" : riskPct >= 20 ? "Medium" : "Low";
  const riskBar = riskLevel === "High" ? 85 : riskLevel === "Medium" ? 55 : 25;

  const dateLabel = now
    ? now.toLocaleDateString("en-MY", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const greetingLabel = now ? greeting() : "Welcome";

  const filteredActivity = useMemo(
    () =>
      MOCK_ACTIVITY.filter(
        (a) => activityFilter === "all" || a.kind === activityFilter,
      ),
    [activityFilter],
  );

  const onQuickAction = (action: QuickAction) => {
    switch (action.type) {
      case "ask":
        setAskOpen(true);
        break;
      case "upload":
      case "analyse":
        setUploadOpen(true);
        break;
      case "draft":
        router.push("/legalai/drafting");
        break;
      case "research":
        router.push("/legalai/research");
        break;
      case "matter":
        setMatterOpen(true);
        break;
      case "navigate":
      default:
        router.push(action.href);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">
              {dateLabel || " "}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {greetingLabel}, {MOCK_USER.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Here&rsquo;s an overview of your legal workspace today.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => setAskOpen(true)}
              className="gap-2"
              size="sm"
            >
              <Bot className="size-4" /> Ask LawMate
            </Button>
            <Button
              onClick={() => setUploadOpen(true)}
              variant="outline"
              className="gap-2"
              size="sm"
            >
              <Upload className="size-4" /> Upload
            </Button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map((a) => {
            const Icon = a.icon;
            const Wrapper = "button";
            const wrapperProps = {
              type: "button" as const,
              onClick: () => onQuickAction(a),
            };
            return (
              <Wrapper
                key={a.label}
                {...(wrapperProps as any)}
                className={cn(
                  "group rounded-lg border bg-card p-3 text-left transition-all hover:border-primary/30 hover:shadow-sm w-full cursor-pointer",
                )}
              >
                <div className={cn("mb-2 inline-flex rounded-md p-2", a.accent)}>
                  <Icon className="size-4" />
                </div>
                <p className="text-sm font-medium leading-tight">{a.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">
                  {a.description}
                </p>
                <ArrowRight className="mt-2 size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </Wrapper>
            );
          })}
        </div>

        <LegalDisclaimer compact />

        {/* Onboarding / no-data prompt when first running */}
        {MOCK_MATTERS.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <h3 className="text-lg font-semibold">
                Welcome to LawMate
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mt-1">
                Your AI-powered legal workspace. Ask a question, upload a
                document or research Malaysian law to get started.
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center">
                <Button onClick={() => setAskOpen(true)} className="gap-2">
                  <Bot className="size-4" /> Ask a legal question
                </Button>
                <Button
                  onClick={() => setUploadOpen(true)}
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="size-4" /> Analyse a document
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/legalai/research">
                    <BookOpen className="size-4" /> Research Malaysian law
                  </Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/legalai/drafting">
                    <FileSignature className="size-4" /> Draft a document
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Top metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard
            label="AI Usage"
            value={m.usage.questionsAsked}
            icon={Bot}
            accent="bg-primary/10 text-primary"
            sub={`${m.usage.documentsAnalysed} docs · ${m.usage.draftsGenerated} drafts`}
            href="/legalai/assistant"
          />
          <MetricCard
            label="Active Matters"
            value={m.activeMatters}
            icon={Briefcase}
            accent="bg-blue-500/10 text-blue-500"
            sub={`${m.highPriorityMatters} high priority`}
            href="/legalai/matters"
          />
          <MetricCard
            label="Total Documents"
            value={m.totalDocuments}
            icon={FileText}
            accent="bg-emerald-500/10 text-emerald-500"
            sub={`${m.processingDocuments} processing`}
            href="/legalai/documents"
          />
          <MetricCard
            label="Tasks Due Today"
            value={m.tasks.today}
            icon={Clock}
            accent="bg-amber-500/10 text-amber-500"
            sub={`${m.tasks.overdue} overdue · ${m.tasks.upcoming} upcoming`}
            href="/legalai/tasks"
          />
        </div>

        {/* Two columns: Risk + Activity */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-amber-500" />
                    Risk Dashboard
                  </CardTitle>
                  <CardDescription>
                    AI-powered overview across all active matters.
                  </CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                  <Link href="/legalai/risk">
                    View all <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="text-3xl font-semibold tracking-tight">
                  {riskLevel}
                </div>
                <Progress value={riskBar} className="flex-1 max-w-md" />
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  {totalRisks} risks · {riskPct}% high
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <RiskTile severity="high" count={m.risks.high} label="High" />
                <RiskTile severity="medium" count={m.risks.medium} label="Medium" />
                <RiskTile severity="low" count={m.risks.low} label="Low" />
              </div>

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Top risks
                </p>
                <div className="space-y-2">
                  {MOCK_RISKS.slice(0, 3).map((r) => {
                    const s = severityClasses(r.severity);
                    return (
                      <Link
                        key={r.id}
                        href="/legalai/risk"
                        className="flex items-start gap-3 rounded-md border bg-card/50 p-3 hover:bg-accent/50 transition-colors"
                      >
                        <span className={cn("mt-1 size-2 shrink-0 rounded-full", s.dot)} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {r.title}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {r.description}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] shrink-0", s.text, s.border)}
                        >
                          {s.label}
                        </Badge>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="size-4 text-primary" /> Recent AI Activity
                  </CardTitle>
                  <CardDescription>Your latest AI-assisted work.</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-wrap pt-1">
                {(["all", "conversation", "document", "research", "draft", "matter"] as const).map(
                  (k) => (
                    <button
                      key={k}
                      onClick={() => setActivityFilter(k)}
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[10px] capitalize transition-colors",
                        activityFilter === k
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:bg-accent",
                      )}
                    >
                      {k}
                    </button>
                  ),
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[260px] sm:h-[320px]">
                <div className="space-y-1">
                  {filteredActivity.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">
                      No activity yet
                    </p>
                  ) : (
                    filteredActivity.map((a) => (
                      <Link
                        key={a.id}
                        href={a.href ?? "/legalai"}
                        className="flex items-start gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent/40 transition-colors"
                      >
                        <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
                          <ActivityIcon kind={a.kind} />
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{a.title}</p>
                          {a.detail && (
                            <p className="text-xs text-muted-foreground truncate">
                              {a.detail}
                            </p>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground whitespace-nowrap mt-0.5">
                          {relativeTime(a.at)}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Matters + Tasks + Notifications row */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="size-4 text-primary" /> Matters
                  </CardTitle>
                  <CardDescription>Active and recent legal matters.</CardDescription>
                </div>
                <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                  <Link href="/legalai/matters">
                    View all <ArrowRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_MATTERS.slice(0, 4).map((m) => {
                const priorityColor =
                  m.priority === "high"
                    ? "text-red-500 border-red-500/30 bg-red-500/10"
                    : m.priority === "medium"
                    ? "text-amber-500 border-amber-500/30 bg-amber-500/10"
                    : "text-blue-500 border-blue-500/30 bg-blue-500/10";
                return (
                  <Link
                    key={m.id}
                    href="/legalai/matters"
                    className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                      <Gavel className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{m.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                        {m.client && <span className="truncate">{m.client}</span>}
                        <span>·</span>
                        <span>{m.documentsCount} docs</span>
                        <span>·</span>
                        <span>{m.tasksCount} tasks</span>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("text-[10px]", priorityColor)}
                    >
                      {m.priority}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px] hidden sm:inline-flex">
                      {m.status}
                    </Badge>
                  </Link>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-500" /> Tasks
              </CardTitle>
              <CardDescription>Your priority tasks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_TASKS.slice(0, 5).map((t) => (
                <Link
                  key={t.id}
                  href="/legalai/tasks"
                  className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/40 transition-colors"
                >
                  <span
                    className={cn(
                      "mt-0.5 size-2 shrink-0 rounded-full",
                      t.status === "done"
                        ? "bg-emerald-500"
                        : t.status === "in_progress"
                        ? "bg-primary"
                        : t.status === "blocked"
                        ? "bg-red-500"
                        : "bg-muted-foreground",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {t.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {t.matterName} · Due {relativeTime(t.dueDate ?? "")}
                    </p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Quick prompts + Research + Drafts */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sparkles className="size-4 text-primary" /> Quick prompts
              </CardTitle>
              <CardDescription>Tap to start an AI conversation.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {PROMPT_SUGGESTIONS.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setAskOpen(true)}
                    className="text-left rounded-md border bg-card/50 p-3 text-sm hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3 text-primary" />
                      <span className="font-medium">{p.label}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-1">
                      {p.prompt}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BookOpen className="size-4 text-primary" /> Research & Sources
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                  <Link href="/legalai/research">
                    <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
              <CardDescription>Recent legal sources used across matters.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "Employment Act 1955 — Part XI",
                "Contracts Act 1950 — s.10",
                "PDPA 2010 — s.7",
                "Industrial Court awards (2023–2024)",
              ].map((title) => (
                <Link
                  key={title}
                  href="/legalai/research"
                  className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-accent/40 transition-colors"
                >
                  <Layers className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{title}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    Verified
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileSignature className="size-4 text-primary" /> Drafts
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                  <Link href="/legalai/drafting">
                    <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
              <CardDescription>
                Documents in progress and recently finalised.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { title: "Warning Letter — Lim Wei Jian", status: "Draft" },
                { title: "Hostel Rules 2026", status: "Review" },
                { title: "PDPA Sub-processor Letter", status: "Draft" },
              ].map((d) => (
                <Link
                  key={d.title}
                  href="/legalai/drafting"
                  className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-accent/40 transition-colors"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{d.title}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {d.status}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Documents + Conversations */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="size-4 text-primary" /> Recent documents
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                  <Link href="/legalai/documents">
                    <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_DOCUMENTS.slice(0, 4).map((d) => (
                <Link
                  key={d.id}
                  href={`/legalai/analysis?documentId=${d.id}`}
                  className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-accent/40 transition-colors"
                >
                  <FileText className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{d.name}</span>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {d.status}
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bot className="size-4 text-primary" /> Recent conversations
                </CardTitle>
                <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                  <Link href="/legalai/assistant">
                    <ArrowUpRight className="size-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {MOCK_CONVERSATIONS.slice(0, 4).map((c) => (
                <Link
                  key={c.id}
                  href="/legalai/assistant"
                  className="flex items-center gap-3 rounded-md border p-3 text-sm hover:bg-accent/40 transition-colors"
                >
                  <Bot className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{c.title}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {c.messageCount} msgs
                  </Badge>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Notifications preview */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="size-4 text-primary" /> Notifications
                </CardTitle>
                <CardDescription>Recent updates and alerts.</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-1 shrink-0">
                <Link href="/legalai/notifications">
                  View all <ArrowRight className="size-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {MOCK_NOTIFICATIONS.slice(0, 4).map((n) => (
              <Link
                key={n.id}
                href={n.href ?? "/legalai/notifications"}
                className="flex items-start gap-3 rounded-md border p-3 hover:bg-accent/40 transition-colors"
              >
                <span
                  className={cn(
                    "mt-0.5 size-2 rounded-full",
                    !n.read ? "bg-primary" : "bg-muted-foreground",
                  )}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  {n.body && (
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {n.body}
                    </p>
                  )}
                </div>
                <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                  {relativeTime(n.createdAt)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <QuickPromptSheet open={askOpen} onOpenChange={setAskOpen} />
      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <CreateMatterDialog open={matterOpen} onOpenChange={setMatterOpen} />
    </DashboardShell>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  accent,
  sub,
  href,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  sub?: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:border-primary/30 transition-colors">
        <CardContent className="flex items-start gap-3 p-4">
          <div className={cn("rounded-md p-2", accent)}>
            <Icon className="size-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tracking-tight">{value}</p>
            {sub && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {sub}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function RiskTile({
  severity,
  count,
  label,
}: {
  severity: "high" | "medium" | "low";
  count: number;
  label: string;
}) {
  const s = severityClasses(severity);
  return (
    <div className={cn("rounded-lg border p-3", s.border, s.bg)}>
      <p className={cn("text-xs font-medium", s.text)}>{label}</p>
      <p className="text-2xl font-semibold mt-1">{count}</p>
    </div>
  );
}

function ActivityIcon({ kind }: { kind: string }) {
  const className = "size-3.5 text-muted-foreground";
  switch (kind) {
    case "conversation":
      return <Bot className={className} />;
    case "document":
      return <FileText className={className} />;
    case "research":
      return <BookOpen className={className} />;
    case "draft":
      return <FileSignature className={className} />;
    case "matter":
      return <Briefcase className={className} />;
    case "analysis":
      return <Sparkles className={className} />;
    default:
      return <Activity className={className} />;
  }
}