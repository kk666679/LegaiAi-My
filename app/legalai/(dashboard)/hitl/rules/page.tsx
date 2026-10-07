import {
  HITLHeader,
  HITLShell,
  HITLEscalationRules,
  type HITLRoutingRule,
} from "@/components/hitl";

const rules: HITLRoutingRule[] = [];

export default function Page() {
  return (
    <HITLShell
      header={
        <HITLHeader
          title="Routing rules"
          description="Manage how review requests are assigned and escalated."
        />
      }
    >
      <div className="space-y-4 p-4 lg:p-6">
        {rules.length > 0 ? (
          <HITLEscalationRules rules={rules} />
        ) : (
          <p className="rounded-lg border border-border/60 p-6 text-sm text-muted-foreground">
            No routing rules are configured.
          </p>
        )}
      </div>
    </HITLShell>
  );
}
