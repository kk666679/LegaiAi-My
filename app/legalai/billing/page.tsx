"use client";

import { toast } from "sonner";
import {
  Activity,
  Sparkles,
  Bot,
  FileText,
  TrendingUp,
  CreditCard,
  Receipt,
  ArrowUpRight,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PLANS, CREDIT_CONFIG } from "@/lib/brand";
import { MOCK_DASHBOARD_METRICS } from "@/lib/lawmate/data";

const INVOICES = [
  { id: "INV-2026-08", period: "August 2026", amount: 169, currency: "MYR", status: "paid" },
  { id: "INV-2026-07", period: "July 2026", amount: 169, currency: "MYR", status: "paid" },
  { id: "INV-2026-06", period: "June 2026", amount: 169, currency: "MYR", status: "paid" },
];

export default function BillingPage() {
  const plan = PLANS.firm_sme;
  const usage = MOCK_DASHBOARD_METRICS.usage;
  const creditsUsed = usage.questionsAsked + usage.documentsAnalysed * 5 + usage.draftsGenerated * 10;
  const creditsTotal = plan.monthlyCredits;
  const usagePct = Math.min(100, (creditsUsed / creditsTotal) * 100);

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Activity className="size-5 text-primary" />
            Billing Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Plan, usage, AI credits, and invoices for your LawMate workspace.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">Current plan</CardTitle>
                  <CardDescription>Team Legal AI · billed monthly</CardDescription>
                </div>
                <Badge variant="secondary">{plan.name}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-1">
                <span className="text-3xl font-semibold tracking-tight">RM{plan.monthlyPrice}</span>
                <span className="text-sm text-muted-foreground mb-1">/ month</span>
              </div>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="rounded-md border bg-card/30 p-3">
                  <p className="text-xs text-muted-foreground">Monthly credits</p>
                  <p className="text-lg font-semibold">{plan.monthlyCredits.toLocaleString()}</p>
                </div>
                <div className="rounded-md border bg-card/30 p-3">
                  <p className="text-xs text-muted-foreground">Value per credit</p>
                  <p className="text-lg font-semibold">RM{CREDIT_CONFIG.valuePerCredit.toFixed(2)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Button size="sm" onClick={() => toast.info("Plan upgrade flow coming soon — contact your account manager.")}>
                  Upgrade plan
                </Button>
                <Button size="sm" variant="outline" onClick={() => toast.info("Subscription portal opens in a new tab.")}>
                  Manage subscription
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Credit usage</CardTitle>
              <CardDescription>This billing period</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Used</span>
                  <span className="font-medium">{creditsUsed.toLocaleString()} / {creditsTotal.toLocaleString()}</span>
                </div>
                <Progress value={usagePct} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <UsageRow label="Questions" value={usage.questionsAsked} icon={Bot} />
                <UsageRow label="Analyses" value={usage.documentsAnalysed} icon={FileText} />
                <UsageRow label="Drafts" value={usage.draftsGenerated} icon={Sparkles} />
                <UsageRow label="Research" value={usage.researchSessions} icon={TrendingUp} />
              </div>
              {usagePct >= CREDIT_CONFIG.warningThreshold * 100 && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-700 dark:text-amber-400">
                  Usage approaching plan limit. Consider upgrading.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Invoices</CardTitle>
                <CardDescription>Recent billing history</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const csv = ["id,period,amount,currency,status"].concat(
                    INVOICES.map((i) => `${i.id},${i.period},${i.amount},${i.currency},${i.status}`),
                  ).join("\n");
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "lawmate-invoices.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                  toast.success(`Downloaded ${INVOICES.length} invoices`);
                }}
              >
                <Receipt className="size-4" /> Download all
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {INVOICES.map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center gap-3 rounded-md border bg-card/30 p-3 hover:bg-accent/30 transition-colors"
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-muted">
                    <CreditCard className="size-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{inv.id}</p>
                    <p className="text-xs text-muted-foreground">{inv.period}</p>
                  </div>
                  <span className="text-sm font-semibold">RM{inv.amount}</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    {inv.status}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="View"
                    onClick={() => toast.info(`Invoice ${inv.id} (${inv.period}) viewer opens in a new tab.`)}
                  >
                    <ArrowUpRight className="size-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}

function UsageRow({ label, value, icon: Icon }: { label: string; value: number; icon: any }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border bg-card/30 p-2">
      <Icon className="size-3 text-muted-foreground" />
      <span className="text-muted-foreground">{label}</span>
      <span className="ml-auto font-medium">{value}</span>
    </div>
  );
}
