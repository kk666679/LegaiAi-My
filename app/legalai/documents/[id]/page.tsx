"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Sparkles,
  FileSearch,
  Send,
  CheckCircle2,
  Archive,
  Copy,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Loader2,
  Bot,
} from "lucide-react";
import { DashboardShell } from "@/components/lawmate/DashboardShell";
import { LegalDisclaimer } from "@/components/lawmate/LegalDisclaimer";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { usePermission } from "@/components/shared/PermissionGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DOC_COURTS,
  DOC_STATUSES,
  DOC_TYPES,
  useDocument,
  useDocumentMutations,
} from "@/hooks/useDocuments";
import { useAuth } from "@/components/auth-provider";
import { formatBytes } from "@/lib/lawmate/utils";

const TYPE_LABEL: Record<string, string> = Object.fromEntries(
  DOC_TYPES.map((t) => [t.value, t.label]),
);
const STATUS_LABEL: Record<string, string> = Object.fromEntries(
  DOC_STATUSES.map((s) => [s.value, s.label]),
);
const COURT_LABEL: Record<string, string> = Object.fromEntries(
  DOC_COURTS.map((c) => [c.value, c.label]),
);

interface Parties {
  plaintiff?: string;
  defendant?: string;
  petitioner?: string;
  respondent?: string;
  appellant?: string;
  appellee?: string;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-MY", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

export default function DocumentDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const canEdit = usePermission("edit_document");
  const canDelete = usePermission("delete_document");

  const id = params?.id ?? "";
  const { document, isLoading, error, retry } = useDocument(id);
  // Mutations invalidate the `documents` query keys, so the detail query
  // refreshes itself — no manual router.refresh() round trip needed.
  const mutations = useDocumentMutations();
  const [pending, setPending] = useState(false);
  const reviewerId = user?.id;

  const doc = document as Record<string, unknown> | null;

  const act = async (label: string, fn: () => Promise<unknown>) => {
    setPending(true);
    try {
      await fn();
      toast.success(label);
    } catch (err) {
      toast.error(`${label} failed`, {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setPending(false);
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className="space-y-4" aria-busy="true" aria-label="Loading document">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle />
          <AlertTitle>Could not load this document</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-3">
            <span>
              {error instanceof Error
                ? error.message
                : "The document may have been deleted or you may not have access."}
            </span>
            <Button size="sm" variant="outline" className="gap-1.5" onClick={retry}>
              <RefreshCw className="size-3.5" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      );
    }

    if (!doc) {
      return (
        <EmptyState
          icon={AlertTriangle}
          title="Document not found"
          description="It may have been deleted, or it belongs to another workspace."
          action="Back to documents"
          actionHref="/legalai/documents"
        />
      );
    }

    const title = String(doc.title ?? "Untitled");
    const status = String(doc.status ?? "draft");
    const docType = String(doc.docType ?? "OTHER");
    const version = Number(doc.version ?? 1);
    const content = typeof doc.content === "string" ? doc.content : "";
    const parties = (doc.parties ?? null) as Parties | null;
    const fileSize = typeof doc.fileSize === "number" ? doc.fileSize : null;
    const tags = Array.isArray(doc.tags) ? (doc.tags as string[]) : [];
    const partyEntries = parties
      ? Object.entries(parties).filter(([, v]) => !!v)
      : [];

    return (
      <div className="space-y-6">
        {/* ── Actions ─────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" className="gap-2">
            <Link href={`/legalai/analysis?documentId=${id}`}>
              <Sparkles className="size-4" /> Analyse with AI
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/legalai/analysis?documentId=${id}&mode=summarise`}>
              <FileSearch className="size-4" /> Summarise
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/legalai/assistant?context=${id}`}>
              <Bot className="size-4" /> Ask LawMate
            </Link>
          </Button>

          {canEdit && status === "draft" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={pending}
              onClick={() =>
                act("Submitted for review", () => mutations.submitForReview(id, reviewerId))
              }
            >
              <Send className="size-4" /> Submit for review
            </Button>
          )}
          {canEdit && status === "review" && reviewerId && (
            <Button
              size="sm"
              className="gap-2"
              disabled={pending}
              onClick={() => act("Document approved", () => mutations.approve(id, reviewerId))}
            >
              <CheckCircle2 className="size-4" /> Approve
            </Button>
          )}
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={pending}
              onClick={() =>
                act("Duplicated", () => mutations.duplicate(id))
              }
            >
              <Copy className="size-4" /> Duplicate
            </Button>
          )}
          {canEdit && status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={pending}
              onClick={() => act("Archived", () => mutations.archive(id))}
            >
              <Archive className="size-4" /> Archive
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-destructive hover:text-destructive"
                  disabled={pending}
                >
                  <Trash2 className="size-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this document?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This removes the document permanently. Approved documents
                    cannot be deleted — archive them instead. The action is
                    recorded in the audit trail.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      act("Deleted", async () => {
                        await mutations.remove(id);
                        router.push("/legalai/documents");
                      })
                    }
                  >
                    Delete permanently
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {status === "approved" && (
          <Alert>
            <CheckCircle2 />
            <AlertTitle>Approved document</AlertTitle>
            <AlertDescription>
              This document has been approved and cannot be deleted. Archive it
              instead if it is no longer active.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Metadata ────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Type" value={TYPE_LABEL[docType] ?? docType} />
              <Field
                label="Status"
                value={<StatusBadge value={status} label={STATUS_LABEL[status] ?? status} />}
              />
              <Field label="Version" value={`v${version}`} />
              <Field
                label="Court"
                value={
                  doc.court ? (COURT_LABEL[String(doc.court)] ?? String(doc.court)) : "—"
                }
              />
              <Field
                label="Case number"
                value={doc.caseNumber ? String(doc.caseNumber) : "—"}
              />
              <Field
                label="Jurisdiction"
                value={doc.jurisdiction ? String(doc.jurisdiction) : "—"}
              />
              <Field
                label="File size"
                value={fileSize != null ? formatBytes(fileSize) : "—"}
              />
              <Field label="Created" value={formatDateTime(doc.createdAt as string)} />
              <Field label="Last updated" value={formatDateTime(doc.updatedAt as string)} />
              {doc.reviewedAt != null && (
                <Field label="Reviewed" value={formatDateTime(doc.reviewedAt as string)} />
              )}
            </dl>

            {tags.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border px-2 py-0.5 text-[11px]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {partyEntries.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Parties</p>
                <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
                  {partyEntries.map(([role, name]) => (
                    <div key={role} className="flex gap-2 text-sm">
                      <dt className="capitalize text-muted-foreground">{role}</dt>
                      <dd className="min-w-0 flex-1 truncate">{String(name)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Content ─────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content</CardTitle>
          </CardHeader>
          <CardContent>
            {content ? (
              <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">
                {content}
              </pre>
            ) : (
              <p className="text-sm text-muted-foreground">
                This document has no stored text content.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1.5">
          <Link href="/legalai/documents">
            <ArrowLeft className="size-4" /> All documents
          </Link>
        </Button>

        <PageHeader
          title={
            <span className="flex items-center gap-2">
              {pending && <Loader2 className="size-5 shrink-0 animate-spin" />}
              {isLoading ? "Loading document…" : String(doc?.title ?? "Document")}
            </span>
          }
          description={
            isLoading ? undefined : (
              <span className="tabular-nums">
                {doc?.docType ? `${TYPE_LABEL[String(doc.docType)] ?? String(doc.docType)}` : null}
                {doc?.version ? ` · v${String(doc.version)}` : ""}
              </span>
            )
          }
        />

        <LegalDisclaimer compact />

        {renderBody()}
      </div>
    </DashboardShell>
  );
}

function Field({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm">{value}</dd>
    </div>
  );
}
