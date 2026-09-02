"use client";

import Link from "next/link";
import { toast } from "sonner";
import {
  Cpu,
  Shield,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Key,
  FileCheck,
  Users,
  Activity,
  Database,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CONTROLS = [
  { id: "encryption", label: "Encryption at rest", status: "enabled", detail: "AES-256 encryption for all stored documents.", icon: Lock },
  { id: "audit", label: "Audit logging", status: "enabled", detail: "All sensitive operations logged.", icon: FileCheck },
  { id: "rbac", label: "Role-based access control", status: "enabled", detail: "Granular permissions per role.", icon: Users },
  { id: "ai_policy", label: "AI usage policy", status: "enabled", detail: "Enforced for all AI operations.", icon: Sparkles },
  { id: "data_classification", label: "Data classification", status: "enabled", detail: "Documents classified (public → privileged).", icon: Database },
  { id: "retention", label: "Data retention policy", status: "review", detail: "Review retention periods quarterly.", icon: Activity },
  { id: "human_review", label: "Human review required", status: "enabled", detail: "Mandatory for high-risk AI output.", icon: Eye },
  { id: "key_rotation", label: "API key rotation", status: "enabled", detail: "Automated rotation every 90 days.", icon: Key },
];

const STATUS_BADGE: Record<string, string> = {
  enabled: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  disabled: "bg-muted text-muted-foreground",
  review: "bg-amber-500/10 text-amber-500 border-amber-500/20",
};

const INDICATORS = [
  { label: "AI provider status", value: "Operational", icon: Cpu, tone: "emerald" },
  { label: "Encryption", value: "Active", icon: Lock, tone: "emerald" },
  { label: "Audit logging", value: "Active", icon: FileCheck, tone: "emerald" },
  { label: "Access control", value: "RBAC enforced", icon: Users, tone: "emerald" },
  { label: "Human review", value: "Required for high-risk", icon: Eye, tone: "amber" },
  { label: "Data classification", value: "4 tiers active", icon: Database, tone: "emerald" },
];

const TONE_CLASSES: Record<string, string> = {
  emerald: "bg-emerald-500/10 text-emerald-500",
  amber: "bg-amber-500/10 text-amber-500",
  red: "bg-red-500/10 text-red-500",
  blue: "bg-blue-500/10 text-blue-500",
};

export default function GovernancePage() {
  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Cpu className="size-5 text-primary" />
            AI Governance
          </h1>
          <p className="text-sm text-muted-foreground">
            Operational status of AI controls, data protection, and compliance policies.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">System indicators</CardTitle>
            <CardDescription>Live status of governance controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {INDICATORS.map((i) => {
                const Icon = i.icon;
                return (
                  <div key={i.label} className="flex items-center gap-3 rounded-md border bg-card/50 p-3">
                    <div className={`flex size-9 items-center justify-center rounded-md ${TONE_CLASSES[i.tone]}`}>
                      <Icon className="size-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-muted-foreground">{i.label}</p>
                      <p className="text-sm font-medium truncate">{i.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Governance controls</CardTitle>
                <CardDescription>Configuration of security, AI, and data policies.</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <Link href="/legalai/audit">
                  View audit log <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {CONTROLS.map((c) => {
                const Icon = c.icon;
                return (
                  <div
                    key={c.id}
                    className="flex items-start gap-3 rounded-md border bg-card/30 p-3 hover:bg-accent/30 transition-colors"
                  >
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Icon className="size-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{c.label}</p>
                        <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[c.status]}`}>
                          {c.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{c.detail}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      onClick={() =>
                        toast.message(`Configure ${c.label}`, {
                          description: c.detail,
                        })
                      }
                    >
                      Configure
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick links</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink href="/legalai/audit" label="Audit trail" desc="View all audit events" icon={FileCheck} />
            <QuickLink href="/legalai/settings/byok" label="AI providers" desc="Manage BYOK keys" icon={Key} />
            <QuickLink href="/legalai/hitl" label="Agent control" desc="Oversee AI agents" icon={Eye} />
            <QuickLink href="/legalai/compliance" label="Compliance" desc="Compliance dashboard" icon={Shield} />
            <QuickLink href="/legalai/settings" label="Settings" desc="Workspace configuration" icon={Activity} />
            <QuickLink href="/legalai/docs" label="Documentation" desc="Governance policies" icon={Database} />
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function QuickLink({ href, label, desc, icon: Icon }: { href: string; label: string; desc: string; icon: any }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md border bg-card/30 p-3 hover:border-primary/30 hover:bg-accent/30 transition-colors"
    >
      <div className="flex size-9 items-center justify-center rounded-md bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="size-3 text-muted-foreground" />
    </Link>
  );
}
