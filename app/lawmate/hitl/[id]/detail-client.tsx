"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { trpcReact } from "@/clients";
import { toast } from "sonner";
import {
  HITLProvider,
  HITLReviewSurface,
  HITLDecisionPanel,
  HITLSourcePanel,
  HITLError,
  HITLFeedbackForm,
  HITLAuditTrail,
  type HITLRequest,
  type HITLActor,
} from "@/components/hitl";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export function HITLDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data, isLoading, error } = trpcReact.hitl.getById.useQuery(id);
  const request = React.useMemo<HITLRequest | null>(() => {
    if (!data) return null;

    const status: HITLRequest["status"] =
      data.status === "approved" || data.status === "executed"
        ? "approved"
        : data.status === "rejected"
          ? "rejected"
          : data.status === "cancelled"
            ? "cancelled"
            : "pending";
    const createdAt = data.createdAt.toISOString();

    return {
      id: data.id,
      title: data.title,
      description: data.description ?? undefined,
      kind: "custom",
      status,
      priority: data.authLevel >= 4 ? "urgent" : data.authLevel >= 3 ? "high" : "normal",
      createdAt,
      updatedAt: createdAt,
      source: {
        domain: "custom",
        action: data.actionType,
        aiModel: data.aiModel ?? undefined,
        resourceId: data.matterId ?? undefined,
      },
      sla: data.expiresAt
        ? {
            hoursAllowed: Math.max(0, (data.expiresAt.getTime() - data.createdAt.getTime()) / 3_600_000),
            startedAt: createdAt,
            dueAt: data.expiresAt.toISOString(),
            breached: data.expiresAt.getTime() < Date.now(),
          }
        : undefined,
    };
  }, [data]);

  const utils = trpcReact.useUtils();

  const approveMut = trpcReact.hitl.approve.useMutation();
  const rejectMut = trpcReact.hitl.reject.useMutation();

  const handleDecide = async (kind: string, comments?: string) => {
    try {
      if (kind === 'approve') {
        await approveMut.mutateAsync({ id, notes: comments });
        toast.success('Request approved');
      } else {
        await rejectMut.mutateAsync({ id, reason: kind === 'request-changes' ? `Changes requested: ${comments ?? ''}` : (comments ?? 'Rejected') });
        toast.success(kind === 'request-changes' ? 'Changes requested' : 'Request rejected');
      }
      await utils.hitl.getById.invalidate(id);
      await utils.hitl.listAll.invalidate();
      await utils.hitl.listPending.invalidate();
      await utils.hitl.stats.invalidate();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    }
  };

  const handleFeedback = async (fb: { score: 1 | 2 | 3 | 4 | 5; category?: string; notes?: string }) => {
    try {
      // Backend REST endpoint for RLHF feedback — relayed via /api/feedback (port 3001)
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traceId: id, rating: fb.score, comment: fb.notes ?? '' }),
      });
      toast.success('Feedback submitted');
      await utils.hitl.getById.invalidate(id);
    } catch {
      toast.error('Failed to submit feedback');
    }
  };

  const user: HITLActor = { id: "u-1", name: "You" };

  if (error) return <div className="p-6"><HITLError description={error.message} /></div>;
  if (isLoading) return <p className="p-6 text-sm text-muted-foreground">Loading review…</p>;
  if (!request) {
    return (
      <div className="p-6">
        <HITLError title="Review request not found" description="This request may have been removed." />
      </div>
    );
  }

  return (
    <HITLProvider requests={[request]} currentUser={user}>
      <HITLReviewSurface
        request={request}
        headerActions={<Button variant="ghost" size="sm" onClick={() => router.push("/legalai/hitl")}>Back</Button>}
        sidePanel={
          <div className="space-y-3">
            <HITLSourcePanel request={request} />
            <HITLDecisionPanel
              request={request}
              onClaim={() => {
                toast.info("Claiming a request is not yet supported by the backend.");
              }}
              onDecide={(kind, comments) => {
                void handleDecide(kind, comments);
              }}
              onEscalate={() => {
                toast.info("Escalation is not yet supported by the backend.");
              }}
            />
            {request.feedback ? (
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Feedback submitted</p>
                <p className="mt-1 text-sm">{request.feedback.score}/5 {request.feedback.category ? `· ${request.feedback.category}` : ""}</p>
                {request.feedback.notes ? <p className="mt-1 text-xs text-muted-foreground">{request.feedback.notes}</p> : null}
              </Card>
            ) : (
              <HITLFeedbackForm
                onSubmit={(fb) => {
                  void handleFeedback(fb);
                }}
              />
            )}
          </div>
        }
        onAddComment={(body, internal) => {
          // Comments on HITL actions are not yet supported by the backend.
          toast.info("Comments are not yet supported by the backend.");
        }}
      >
        <Tabs defaultValue="preview">
          <TabsList>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="mt-3">
            <p className="text-sm text-muted-foreground">Content preview renders here — a document, a draft, a diff, or a JSON payload.</p>
          </TabsContent>
          <TabsContent value="audit" className="mt-3">
            <HITLAuditTrail events={request.activity ?? []} />
          </TabsContent>
        </Tabs>
      </HITLReviewSurface>
    </HITLProvider>
  );
}
