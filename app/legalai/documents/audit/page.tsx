"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Gavel,
  Search,
  Filter,
  Shield,
  User as UserIcon,
  FileText,
  Bot,
  Sparkles,
  Key,
  Eye,
  Lock,
  Activity,
  Download,
  AlertTriangle,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { relativeTime } from "@/lib/lawmate/utils";

type AuditKind =
  | "document"
  | "ai"
  | "auth"
  | "permission"
  | "provider"
  | "export"
  | "share"
  | "delete";

interface AuditEvent {
  id: string;
  kind: AuditKind;
  action: string;
  actor: string;
  target: string;
  at: string;
  ip?: string;
  status: "success" | "failure";
}

const KIND_ICON: Record<AuditKind, any> = {
  document: FileText,
  ai: Sparkles,
  auth: Shield,
  permission: Lock,
  provider: Key,
  export: Download,
  share: Eye,
  delete: AlertTriangle,
};

const KIND_BADGE: Record<AuditKind, string> = {
  document: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  ai: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  auth: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  permission: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  provider: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  export: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  share: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  delete: "bg-red-500/10 text-red-500 border-red-500/20",
};

const EVENTS: AuditEvent[] = [
  { id: "ae-1", kind: "document", action: "Document uploaded", actor: "Aisyah Rahman", target: "Employment Agreement — Lim Wei Jian.pdf", at: "2026-09-01T14:32:00Z", status: "success" },
  { id: "ae-2", kind: "ai", action: "AI analysis started", actor: "Aisyah Rahman", target: "Employment Agreement — Lim Wei Jian.pdf", at: "2026-09-01T14:32:10Z", status: "success" },
  { id: "ae-3", kind: "ai", action: "AI analysis completed", actor: "system", target: "Employment Agreement — Lim Wei Jian.pdf", at: "2026-09-01T14:33:45Z", status: "success" },
  { id: "ae-4", kind: "provider", action: "API key rotated", actor: "Aisyah Rahman", target: "OpenAI Provider", at: "2026-09-01T13:00:00Z", status: "success" },
  { id: "ae-5", kind: "export", action: "Document exported", actor: "Aisyah Rahman", target: "PDPA Audit Findings.pdf", at: "2026-09-01T11:20:00Z", status: "success" },
  { id: "ae-6", kind: "share", action: "Document shared", actor: "Aisyah Rahman", target: "Share Purchase Agreement — Valley Foods.pdf → Junior Counsel", at: "2026-09-01T10:15:00Z", status: "success" },
  { id: "ae-7", kind: "permission", action: "Permission granted", actor: "Aisyah Rahman", target: "Editor role on Matter m-1003", at: "2026-09-01T09:30:00Z", status: "success" },
  { id: "ae-8", kind: "auth", action: "Login failed (invalid credentials)", actor: "unknown", target: "aisyah@lawmate.ai", at: "2026-09-01T08:45:00Z", status: "failure" },
  { id: "ae-9", kind: "auth", action: "Login successful", actor: "Aisyah Rahman", target: "aisyah@lawmate.ai", at: "2026-09-01T08:50:00Z", status: "success" },
  { id: "ae-10", kind: "ai", action: "Citation validation started", actor: "Aisyah Rahman", target: "Draft: Warning Letter", at: "2026-08-31T17:00:00Z", status: "success" },
  { id: "ae-11", kind: "delete", action: "Document deleted", actor: "Aisyah Rahman", target: "Outdated-template-v1.pdf", at: "2026-08-31T15:00:00Z", status: "success" },
  { id: "ae-12", kind: "provider", action: "Provider enabled", actor: "Aisyah Rahman", target: "Ollama (local)", at: "2026-08-30T10:00:00Z", status: "success" },
];

export default function AuditPage() {
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  const filtered = EVENTS.filter((e) => {
    if (kind !== "all" && e.kind !== kind) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        e.action.toLowerCase().includes(q) ||
        e.target.toLowerCase().includes(q) ||
        e.actor.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const exportLog = () => {
    setExporting(true);
    try {
      const header = ["id", "kind", "action", "actor", "target", "at", "status"].join(",");
      const lines = filtered.map((e) =>
        [e.id, e.kind, e.action, e.actor, e.target, e.at, e.status]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
      const blob = new Blob([header + "\n" + lines.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lawmate-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${filtered.length} audit events`);
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
              <Gavel className="size-5 text-primary" />
              Audit Trail
            </h1>
            <p className="text-sm text-muted-foreground">
              Complete, immutable record of all security-sensitive and material operations.
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2" onClick={exportLog} disabled={exporting}>
            <Download className="size-4" /> {exporting ? "Exporting…" : "Export log"}
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatTile label="Total events" value={EVENTS.length} icon={Activity} accent="bg-primary/10 text-primary" />
          <StatTile label="AI operations" value={EVENTS.filter((e) => e.kind === "ai").length} icon={Sparkles} accent="bg-violet-500/10 text-violet-500" />
          <StatTile label="Document ops" value={EVENTS.filter((e) => e.kind === "document" || e.kind === "export" || e.kind === "delete").length} icon={FileText} accent="bg-blue-500/10 text-blue-500" />
          <StatTile label="Auth events" value={EVENTS.filter((e) => e.kind === "auth" || e.kind === "permission").length} icon={Shield} accent="bg-emerald-500/10 text-emerald-500" />
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search events…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={kind} onValueChange={setKind}>
                <SelectTrigger className="h-9 w-auto text-xs">
                  <Filter className="size-3" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="ai">AI</SelectItem>
                  <SelectItem value="auth">Authentication</SelectItem>
                  <SelectItem value="permission">Permission</SelectItem>
                  <SelectItem value="provider">Provider</SelectItem>
                  <SelectItem value="export">Export</SelectItem>
                  <SelectItem value="share">Share</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Gavel className="size-8 text-muted-foreground opacity-40 mb-3" />
                <p className="font-medium">No events found</p>
                <p className="text-sm text-muted-foreground mt-1">Try a different search or filter.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map((e) => {
                  const Icon = KIND_ICON[e.kind];
                  return (
                    <div
                      key={e.id}
                      className="flex items-start gap-3 rounded-md border bg-card/30 p-3 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                        <Icon className="size-3.5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{e.action}</p>
                          <Badge variant="outline" className={`text-[10px] ${KIND_BADGE[e.kind]}`}>
                            {e.kind}
                          </Badge>
                          {e.status === "failure" && (
                            <Badge variant="destructive" className="text-[10px]">Failed</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">{e.target}</p>
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <UserIcon className="size-2.5" /> {e.actor}
                          </span>
                          <span>{relativeTime(e.at)}</span>
                        </div>
                      </div>
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

function StatTile({ label, value, icon: Icon, accent }: { label: string; value: number; icon: any; accent: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md p-2 ${accent}`}>
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-2xl font-semibold tracking-tight">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
