"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileCheck,
  Search,
  Plus,
  FileText,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MoreHorizontal,
  Filter,
  Eye,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MOCK_DOCUMENTS, MOCK_MATTERS } from "@/lib/lawmate/data";
import { relativeTime, formatBytes } from "@/lib/lawmate/utils";

const CONTRACT_STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  review: { label: "In Review", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  expired: { label: "Expired", cls: "bg-red-500/10 text-red-500 border-red-500/20" },
  draft: { label: "Draft", cls: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
};

const RISK_TILES = [
  { label: "Active contracts", value: 12, icon: FileCheck, tone: "primary" },
  { label: "In review", value: 4, icon: Clock, tone: "warning" },
  { label: "High risk", value: 2, icon: AlertTriangle, tone: "danger" },
  { label: "Expiring soon", value: 3, icon: Sparkles, tone: "info" },
];

export default function ContractsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const contracts = MOCK_DOCUMENTS.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (status !== "all" && d.status !== status) return false;
    return true;
  }).map((d, i) => ({
    ...d,
    contractStatus: (["active", "review", "draft", "expired"] as const)[i % 4],
    riskScore: Math.round(20 + ((i * 13) % 60)),
  }));

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Contracts</h1>
            <p className="text-sm text-muted-foreground">
              Review, track and analyse contracts and agreements.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href="/legalai/analysis">
                <Sparkles className="size-4" /> Analyse
              </Link>
            </Button>
            <Button size="sm" className="gap-2" asChild>
              <Link href="/legalai/drafting">
                <Plus className="size-4" /> New contract
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {RISK_TILES.map((r) => {
            const tones: Record<string, string> = {
              primary: "bg-primary/10 text-primary",
              warning: "bg-amber-500/10 text-amber-500",
              danger: "bg-red-500/10 text-red-500",
              info: "bg-blue-500/10 text-blue-500",
            };
            return (
              <Card key={r.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className={`rounded-md p-2 ${tones[r.tone]}`}>
                    <r.icon className="size-4" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{r.label}</p>
                    <p className="text-2xl font-semibold tracking-tight">{r.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search contracts…"
                  className="pl-8 h-9 text-sm"
                />
              </div>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 w-auto text-xs">
                  <Filter className="size-3" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="review">In Review</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {contracts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <FileCheck className="size-8 text-muted-foreground opacity-40 mb-3" />
                <p className="font-medium">No contracts yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Upload a contract or use AI drafting to create one from a template.
                </p>
                <Button className="mt-4 gap-2" asChild>
                  <Link href="/legalai/drafting">
                    <Plus className="size-4" /> Create contract
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {contracts.map((c) => {
                  const matter = MOCK_MATTERS.find((m) => m.id === c.matterId);
                  const st = (CONTRACT_STATUS[c.contractStatus as keyof typeof CONTRACT_STATUS] ?? CONTRACT_STATUS.review) as { label: string; cls: string };
                  return (
                    <div
                      key={c.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-md border p-3 hover:bg-accent/30 transition-colors"
                    >
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{c.name}</p>
                          <Badge variant="outline" className={`text-[10px] ${st.cls}`}>
                            {st.label}
                          </Badge>
                        </div>
                        <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span>{formatBytes(c.size)}</span>
                          {c.pageCount && (
                            <>
                              <span>·</span>
                              <span>{c.pageCount} pages</span>
                            </>
                          )}
                          <span>·</span>
                          <span>{relativeTime(c.uploadedAt)}</span>
                          {matter && (
                            <>
                              <span>·</span>
                              <span className="truncate">{matter.name}</span>
                            </>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">AI risk score</span>
                          <Progress value={c.riskScore} className="h-1 max-w-[120px]" />
                          <span className="text-[10px] font-medium">{c.riskScore} / 100</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 justify-end">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="View"
                          asChild
                        >
                          <Link href={`/legalai/analysis?documentId=${c.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon-sm" aria-label="Actions">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/legalai/analysis?documentId=${c.id}`} className="gap-2">
                                <Sparkles className="size-3.5" /> Analyse
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/legalai/assistant?context=${c.id}`} className="gap-2">
                                <CheckCircle2 className="size-3.5" /> Ask LawMate
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => toast.info(`Opening ${c.name}`)}
                              className="gap-2"
                            >
                              <FileText className="size-3.5" /> Open
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
