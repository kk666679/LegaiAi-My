import { Bell, AlertTriangle, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "@/app/legalai/(dashboard)/_components/module-page";

const stats: ModuleStat[] = [
  { label: "Unread alerts", value: "9", hint: "Requires attention", tone: "warning" },
  { label: "Critical", value: "2", hint: "Escalated", tone: "danger" },
  { label: "Acknowledged", value: "14", hint: "This week", tone: "success" },
  { label: "Response SLA", value: "3h", hint: "Average", tone: "default" },
];

export default function AlertsPage() {
  return (
    <ModulePage
      title="Alerts"
      description="Monitor priority risks, deadlines, and operational alerts that need immediate attention."
      stats={stats}
      sections={[
        {
          title: "Alert overview",
          description: "Current priority notifications",
          content: (
            <div className="space-y-3">
              {[["Contract expiry risk", "High severity · Partner review"], ["Matter deadline approaching", "3 days remaining"], ["Unauthorized document share", "Blocked and logged"]].map(([title, detail]) => (
                <div key={title} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <AlertTriangle className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{title}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Action queue",
          description: "Alerts that require follow-up or acknowledgement",
          content: (
            <div className="space-y-3">
              {[["Matter risk escalation", "Open"], ["Deviation flagged in contract playbook", "Pending"], ["Security policy exception", "Reviewed"]].map(([alert, status]) => (
                <div key={alert} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                  <span className="text-sm font-medium">{alert}</span>
                  <span className="text-xs text-muted-foreground">{status}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
