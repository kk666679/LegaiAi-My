"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
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
  const [request, setRequest] = React.useState<HITLRequest | null>(null);
  const [error, setError] = React.useState<string>();

  React.useEffect(() => {
    let cancelled = false;
    // GET /api/hitl/:id
    // Placeholder:
    Promise.resolve(null)
      .then((r) => { if (!cancelled) setRequest(r as HITLRequest | null); })
      .catch((e) => { if (!cancelled) setError(String(e?.message ?? e)); });
    return () => { cancelled = true; };
  }, [id]);

  const user: HITLActor = { id: "u-1", name: "You" };

  if (error) return <div className="p-6"><HITLError description={error} /></div>;
  if (!request) return <p className="p-6 text-sm text-muted-foreground">Loading review…</p>;

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
              onClaim={() => { /* POST /api/hitl/:id/claim */ }}
              onDecide={(kind, comments) => { /* POST /api/hitl/:id/decide */ }}
              onEscalate={() => { /* POST /api/hitl/:id/escalate */ }}
            />
            {request.feedback ? (
              <Card className="p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Feedback submitted</p>
                <p className="mt-1 text-sm">{request.feedback.score}/5 {request.feedback.category ? `· ${request.feedback.category}` : ""}</p>
                {request.feedback.notes ? <p className="mt-1 text-xs text-muted-foreground">{request.feedback.notes}</p> : null}
              </Card>
            ) : (
              <HITLFeedbackForm
                onSubmit={(fb) => { /* POST /api/hitl/:id/feedback */ }}
              />
            )}
          </div>
        }
        onAddComment={(body, internal) => { /* POST /api/hitl/:id/comments */ }}
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
