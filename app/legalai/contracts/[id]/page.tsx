"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/lawmate/utils";
import { FileText, AlertTriangle, CalendarClock, FileSignature, BarChart3, Activity } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "Review",
  negotiation: "Negotiation",
  executed: "Executed",
  expired: "Expired",
  terminated: "Terminated",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  review: "bg-blue-100 text-blue-700",
  negotiation: "bg-amber-100 text-amber-700",
  executed: "bg-green-100 text-green-700",
  expired: "bg-red-100 text-red-700",
  terminated: "bg-gray-100 text-gray-500",
};

const TABS = [
  { id: "overview", label: "Overview", icon: FileText },
  { id: "obligations", label: "Obligations", icon: FileSignature },
  { id: "risks", label: "Risks", icon: AlertTriangle },
  { id: "playbook", label: "Playbook", icon: BarChart3 },
  { id: "versions", label: "Versions", icon: Activity },
  { id: "ai", label: "AI", icon: BarChart3 },
] as const;

export default function ContractDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = React.useState(tabParam ?? "overview");

  React.useEffect(() => {
    if (tabParam) setActiveTab(tabParam);
  }, [tabParam]);

  const contract = trpcReact.contracts.getById.useQuery(id, { staleTime: 30_000 });
  const analyzeMutation = trpcReact.contracts.analyzeWithAI.useMutation();
  const loading = contract.isLoading;
  const failed = contract.isError;

  const [analysisResult, setAnalysisResult] = React.useState<any>(null);
  const [analysisError, setAnalysisError] = React.useState<string | null>(null);

  if (loading) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              {TABS.map(t => <TabsTrigger key={t.id} value={t.id}>{t.label}</TabsTrigger>)}
            </TabsList>
            <TabsContent value="overview"><div className="p-4 space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div></TabsContent>
          </Tabs>
        </div>
      </DashboardShell>
    );
  }

  if (failed || !contract.data) {
    return (
      <DashboardShell>
        <div className="space-y-6 p-4 lg:p-6">
          <div className="text-center py-12">
            <FileText className="size-12 mx-auto text-destructive" />
            <h2 className="mt-4 text-xl font-semibold">Contract not found</h2>
            <p className="mt-2 text-muted-foreground">The contract you're looking for doesn't exist or you don't have access.</p>
            <Button asChild className="mt-4"><Link href="/legalai/contracts">Back to contracts</Link></Button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const c = contract.data;

  const runAnalysis = async () => {
    setAnalysisError(null);
    try {
      const result = await analyzeMutation.mutateAsync({ contractId: id, analysisType: "full" });
      setAnalysisResult(result);
    } catch (err: any) {
      setAnalysisError(err.message ?? "Analysis failed");
    }
  };

  const analysisLoading = analyzeMutation.isPending;

  const obligations = c.obligations as Record<string, unknown> | null | undefined;
  const keyTerms = c.keyTerms as Record<string, unknown> | null | undefined;
  const playbook = c.playbook as Record<string, unknown> | null | undefined;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <PageHeader
          title={c.title}
          description={
            <>
              <Badge variant="secondary" className="mr-2">{c.contractType}</Badge>
              <Badge variant="outline" className={cn(STATUS_COLORS[c.status])}>{STATUS_LABELS[c.status] ?? c.status}</Badge>
              {c.client && (
                <>
                  <span className="mx-2">·</span>
                  <Link href={`/legalai/clients/${c.clientId}`} className="text-primary hover:underline">
                    {c.client.name}
                  </Link>
                </>
              )}
            </>
          }
          actions={
            <Button variant="outline" size="sm" onClick={runAnalysis} disabled={analysisLoading}>
              {analysisLoading ? "Analysing..." : "Analyse with AI"}
            </Button>
          }
        />

        <div className="grid gap-4 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline" className={cn(STATUS_COLORS[c.status])}>{STATUS_LABELS[c.status] ?? c.status}</Badge>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Value</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm font-medium">{c.value ? `${c.currency ?? "MYR"} ${c.value.toLocaleString()}` : "—"}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Effective</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">{formatDate(c.effectiveDate)}</span>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Expires</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-muted-foreground">{formatDate(c.expiryDate)}</span>
            </CardContent>
          </Card>
        </div>

        {analysisError && (
          <div className="text-center py-8 text-destructive">
            <p>Analysis failed: {analysisError}</p>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            {TABS.map(t => (
              <TabsTrigger key={t.id} value={t.id} className="gap-2">
                <t.icon className="size-3.5" /> {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="size-4" /> Contract Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {c.content && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground">Content</h4>
                    <pre className="mt-1 text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">{c.content}</pre>
                  </div>
                )}
                <dl className="grid gap-2 sm:grid-cols-2 text-sm">
                  <div><dt className="text-muted-foreground">Counterparty</dt><dd>{c.counterparty ?? "—"}</dd></div>
                  <div><dt className="text-muted-foreground">Auto Renew</dt><dd>{c.autoRenew ? "Yes" : "No"}</dd></div>
                  <div><dt className="text-muted-foreground">Renewal Notice</dt><dd>{c.renewalNoticeDays ?? 30} days</dd></div>
                  <div><dt className="text-muted-foreground">Version</dt><dd>{c.version}</dd></div>
                </dl>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="obligations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="size-4" /> Obligations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {obligations && Object.keys(obligations).length > 0 ? (
                  <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">{JSON.stringify(obligations, null, 2)}</pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No obligations extracted yet. Run AI analysis to extract obligations.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="size-4" /> Risk Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {c.riskScore !== undefined && c.riskLevel ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="text-4xl font-bold tabular-nums">{Math.round((c.riskScore ?? 0) * 100)}%</div>
                      <Badge variant={c.riskLevel === "critical" ? "destructive" : c.riskLevel === "high" ? "secondary" : "outline"}>
                        {c.riskLevel}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Risk score is derived from AI analysis. Run full analysis for detailed breakdown.</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No risk analysis available. Run AI analysis to assess contract risks.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="playbook" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-4" /> Playbook Deviations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {playbook && Object.keys(playbook).length > 0 ? (
                  <pre className="text-sm whitespace-pre-wrap bg-muted/50 p-4 rounded-md">{JSON.stringify(playbook, null, 2)}</pre>
                ) : (
                  <p className="text-sm text-muted-foreground">No playbook deviations tracked. Run AI analysis to compare against standard playbook.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="size-4" /> Version History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Current version: v{c.version}</p>
                <div className="mt-4 space-y-2">
                  <div className="p-3 rounded-md border bg-card/40">
                    <p className="font-medium text-sm">Current version (v{c.version})</p>
                    <p className="text-xs text-muted-foreground">Updated {formatDate(c.updatedAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="size-4" /> AI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {analysisLoading ? (
                  <Skeleton className="h-40 w-full" />
                ) : analysisResult ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium">Job ID</h4>
                      <p className="text-sm text-muted-foreground">{analysisResult.jobId}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Trace ID</h4>
                      <p className="text-sm text-muted-foreground">{analysisResult.traceId}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">Analysis job queued. Check job status via the backend queue dashboard.</p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground mb-4">Run AI analysis to extract obligations, risks, and playbook deviations.</p>
                    <Button onClick={runAnalysis} disabled={analysisLoading} className="gap-2">
                      {analysisLoading ? "Running..." : "Run Full Analysis"}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardShell>
  );
}