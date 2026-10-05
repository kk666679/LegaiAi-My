"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowDownUp,
  CalendarClock,
  FileCheck,
  Plus,
  Search,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { trpcReact } from "@/clients";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { DocumentsNav } from "@/components/documents/DocumentsNav";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { PermissionGate } from "@/components/shared/PermissionGate";
import { EmptyState } from "@/components/shared/EmptyState";
import { ListSkeleton } from "@/components/shared/PageSkeleton";
import { PageHeader } from "@/components/shared/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CONTRACT_TYPES = [
  { value: "NDA", label: "Non-disclosure agreement" },
  { value: "SERVICE", label: "Services agreement" },
  { value: "EMPLOYMENT", label: "Employment agreement" },
  { value: "LEASE", label: "Lease" },
  { value: "SALE", label: "Sale and purchase" },
  { value: "LOAN", label: "Loan agreement" },
  { value: "PARTNERSHIP", label: "Partnership agreement" },
  { value: "OTHER", label: "Other" },
] as const;

const CONTRACT_STATUSES = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "review", label: "In review" },
  { value: "negotiation", label: "Negotiation" },
  { value: "executed", label: "Executed" },
  { value: "expired", label: "Expired" },
  { value: "terminated", label: "Terminated" },
] as const;

interface ContractRow {
  id: string;
  title: string;
  contractType: string;
  status: string;
  counterparty?: string | null;
  value?: number | null;
  currency?: string | null;
  expiryDate?: string | null;
  updatedAt?: string;
  client?: { id: string; name: string } | null;
  matter?: { id: string; title: string } | null;
}

interface ContractDetail extends ContractRow {
  content?: string | null;
  effectiveDate?: string | null;
  autoRenew?: boolean;
  renewalNoticeDays?: number | null;
  riskScore?: number | null;
  riskLevel?: string | null;
  keyTerms?: unknown;
  obligations?: unknown;
}

interface ContractStats {
  total: number;
  expiringSoon: number;
  byStatus: Record<string, number>;
  byType: Record<string, number>;
}

function labelFor(value?: string | null) {
  return value
    ? value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "—";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-MY", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatJson(value: unknown) {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}

export default function ContractsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const cursor = cursorStack[cursorStack.length - 1];
  const listQuery = trpcReact.contracts.list.useQuery(
    {
      search: search.trim() || undefined,
      status: status === "all" ? undefined : status,
      limit: 25,
      cursor,
    },
    { retry: false },
  );
  const statsQuery = trpcReact.contracts.stats.useQuery(undefined, {
    retry: false,
  });
  const selectedQuery = trpcReact.contracts.getById.useQuery(selectedId, {
    enabled: !!selectedId,
    retry: false,
  });
  const createContract = trpcReact.contracts.create.useMutation();
  const analyzeContract = trpcReact.contracts.analyzeWithAI.useMutation();
  const utils = trpcReact.useUtils();
  const contracts = (listQuery.data?.contracts ?? []) as ContractRow[];
  const stats = statsQuery.data as ContractStats | undefined;
  const contract = selectedQuery.data as ContractDetail | undefined;

  const create = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") ?? "").trim();
    const counterparty = String(form.get("counterparty") ?? "").trim();
    const content = String(form.get("content") ?? "").trim();
    const contractType = String(form.get("contractType") ?? "OTHER");
    if (!title) return;

    try {
      const created = await createContract.mutateAsync({
        title,
        contractType,
        counterparty: counterparty || undefined,
        content: content || undefined,
      });
      setSelectedId(created.id);
      setCreateOpen(false);
      toast.success("Contract created");
      void Promise.all([
        utils.contracts.list.invalidate(),
        utils.contracts.stats.invalidate(),
      ]).catch((error) => {
        toast.error("Contract created, but the list could not refresh", {
          description:
            error instanceof Error ? error.message : "Refresh the page to see it.",
        });
      });
    } catch (error) {
      toast.error("Could not create contract", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const runAnalysis = async (contractId: string) => {
    try {
      const result = await analyzeContract.mutateAsync({
        contractId,
        analysisType: "full",
      });
      toast.success("Contract analysis queued", {
        description: `Job ${result.jobId} is queued. Results will appear when processing is available.`,
      });
    } catch (error) {
      toast.error("Could not queue contract analysis", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <DashboardShell>
      <div className="space-y-5">
        <DocumentsNav showLabel={false} className="-mx-4 sm:-mx-6 lg:-mx-8" />
        <PageHeader
          title="Contracts"
          description="Track persisted agreements, key dates, and available analysis."
          actions={
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="size-4" aria-hidden />
                  New contract
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create contract record</DialogTitle>
                  <DialogDescription>
                    Add an agreement to the workspace. Analysis is not run until
                    explicitly requested.
                  </DialogDescription>
                </DialogHeader>
                <form id="create-contract-form" onSubmit={create} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-title">Title *</Label>
                    <Input
                      id="contract-title"
                      name="title"
                      required
                      maxLength={500}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-type">Contract type</Label>
                    <Select name="contractType" defaultValue="OTHER">
                      <SelectTrigger id="contract-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-counterparty">Counterparty</Label>
                    <Input id="contract-counterparty" name="counterparty" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contract-content">Contract text</Label>
                    <Textarea
                      id="contract-content"
                      name="content"
                      className="min-h-32"
                      placeholder="Optional. Store only information authorized for this workspace."
                    />
                  </div>
                </form>
                <DialogFooter>
                  <Button
                    type="submit"
                    form="create-contract-form"
                    disabled={createContract.isPending}
                  >
                    {createContract.isPending ? "Creating…" : "Create contract"}
                  </Button>
                </DialogFooter>
                {createContract.isError ? (
                  <p className="text-sm text-destructive" role="alert">
                    {createContract.error.message}
                  </p>
                ) : null}
              </DialogContent>
            </Dialog>
          }
        />

        <LegalDisclaimer compact />

        {(listQuery.isError || statsQuery.isError || selectedQuery.isError) && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" aria-hidden />
            <AlertTitle>Contract data is unavailable</AlertTitle>
            <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
              <span>
                {listQuery.error?.message ??
                  statsQuery.error?.message ??
                  selectedQuery.error?.message}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  void listQuery.refetch();
                  void statsQuery.refetch();
                  if (selectedId) void selectedQuery.refetch();
                }}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Contracts" value={stats?.total} loading={statsQuery.isLoading} />
          <Metric
            label="Expiring within 90 days"
            value={stats?.expiringSoon}
            loading={statsQuery.isLoading}
          />
          <Metric
            label="In review"
            value={stats?.byStatus.review ?? 0}
            loading={statsQuery.isLoading}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="min-w-0 space-y-3" aria-label="Contract library">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setCursorStack([]);
                  }}
                  aria-label="Search contracts"
                  placeholder="Search title or counterparty…"
                  className="h-9 pl-9"
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setCursorStack([]);
                }}
              >
                <SelectTrigger className="h-9 w-full sm:w-48" aria-label="Filter by contract status">
                  <ArrowDownUp className="size-3.5" aria-hidden />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTRACT_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {listQuery.isLoading ? (
              <ListSkeleton rows={5} />
            ) : contracts.length ? (
              <div className="space-y-2">
                {contracts.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => setSelectedId(row.id)}
                    aria-pressed={selectedId === row.id}
                    className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-accent/40 ${
                      selectedId === row.id ? "border-primary/50 bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="rounded-md bg-primary/10 p-2 text-primary">
                        <FileCheck className="size-4" aria-hidden />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{row.title}</span>
                          <Badge variant="outline">{labelFor(row.status)}</Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {labelFor(row.contractType)}
                          {row.counterparty ? ` · ${row.counterparty}` : ""}
                          {row.client?.name ? ` · ${row.client.name}` : ""}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          {row.expiryDate ? (
                            <span className="inline-flex items-center gap-1">
                              <CalendarClock className="size-3" aria-hidden />
                              Expires {formatDate(row.expiryDate)}
                            </span>
                          ) : null}
                          <span>
                            {row.updatedAt ? formatDate(row.updatedAt) : "Date unavailable"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8">
                  <EmptyState
                    icon={FileCheck}
                    title={search || status !== "all" ? "No matching contracts" : "No contracts recorded"}
                    description={
                      search || status !== "all"
                        ? "Change the search or status filter to see other contracts."
                        : "Create a contract record to track its status and dates."
                    }
                  />
                </CardContent>
              </Card>
            )}

            {cursorStack.length > 0 || listQuery.data?.hasMore ? (
              <div className="flex items-center justify-between border-t pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!cursorStack.length || listQuery.isFetching}
                  onClick={() => setCursorStack((current) => current.slice(0, -1))}
                >
                  Previous
                </Button>
                <span className="text-xs text-muted-foreground">
                  Page {cursorStack.length + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={
                    listQuery.isFetching ||
                    !listQuery.data?.hasMore ||
                    !listQuery.data?.nextCursor
                  }
                  onClick={() => {
                    const nextCursor = listQuery.data?.nextCursor;
                    if (nextCursor) setCursorStack((current) => [...current, nextCursor]);
                  }}
                >
                  Next
                </Button>
              </div>
            ) : null}
          </section>

          <Card className="self-start">
            <CardContent className="space-y-4 p-4">
              {selectedQuery.isLoading ? (
                <ListSkeleton rows={4} />
              ) : contract ? (
                <>
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Contract details</p>
                        <h2 className="mt-1 text-lg font-semibold">{contract.title}</h2>
                      </div>
                      <Badge variant="outline">{labelFor(contract.status)}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {labelFor(contract.contractType)}
                      {contract.counterparty ? ` · ${contract.counterparty}` : ""}
                    </p>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <Detail label="Client" value={contract.client?.name ?? "—"} />
                    <Detail label="Matter" value={contract.matter?.title ?? "—"} />
                    <Detail label="Effective" value={formatDate(contract.effectiveDate)} />
                    <Detail label="Expiry" value={formatDate(contract.expiryDate)} />
                    <Detail
                      label="Value"
                      value={
                        contract.value == null
                          ? "—"
                          : `${contract.currency ?? "MYR"} ${contract.value.toLocaleString()}`
                      }
                    />
                    <Detail
                      label="Auto-renewal"
                      value={
                        contract.autoRenew
                          ? `Yes · ${contract.renewalNoticeDays ?? 30} days' notice`
                          : "No"
                      }
                    />
                    <Detail label="Stored risk level" value={labelFor(contract.riskLevel)} />
                    <Detail
                      label="Stored risk score"
                      value={contract.riskScore == null ? "Not analyzed" : `${contract.riskScore}`}
                    />
                  </dl>

                  <PermissionGate permission="run_agents">
                    <Button
                      className="w-full gap-2"
                      variant="outline"
                      disabled={analyzeContract.isPending}
                      onClick={() => void runAnalysis(contract.id)}
                    >
                      <Sparkles className="size-4" aria-hidden />
                      {analyzeContract.isPending ? "Queueing analysis…" : "Run contract analysis"}
                    </Button>
                  </PermissionGate>

                  {contract.keyTerms != null ? (
                    <JsonSection title="Stored key terms" value={contract.keyTerms} />
                  ) : null}
                  {contract.obligations != null ? (
                    <JsonSection title="Stored obligations" value={contract.obligations} />
                  ) : null}
                  {contract.content ? (
                    <section className="space-y-2">
                      <h3 className="text-sm font-medium">Contract text</h3>
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
                        {contract.content}
                      </pre>
                    </section>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No contract text is stored for this record.
                    </p>
                  )}
                </>
              ) : selectedQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Could not load contract details</AlertTitle>
                  <AlertDescription>{selectedQuery.error.message}</AlertDescription>
                </Alert>
              ) : (
                <EmptyState
                  icon={FileCheck}
                  title="Select a contract"
                  description="Choose a record from the list to view its persisted details."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}

function Metric({
  label,
  value,
  loading,
}: {
  label: string;
  value?: number;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-semibold">
          {loading ? "…" : (value ?? "—")}
        </p>
      </CardContent>
    </Card>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words">{value}</dd>
    </div>
  );
}

function JsonSection({ title, value }: { title: string; value: unknown }) {
  const text = formatJson(value);
  if (!text) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-medium">{title}</h3>
      <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-md bg-muted/40 p-3 text-xs">
        {text}
      </pre>
    </section>
  );
}
