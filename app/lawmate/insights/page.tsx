import { Activity, Clock3, Bell, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "../_components/module-page";

const stats: ModuleStat[] = [
  { label: "Live signals", value: "28", hint: "Across team matters", tone: "default" },
  { label: "Risk alerts", value: "6", hint: "Needs attention", tone: "warning" },
  { label: "Timeline events", value: "143", hint: "Updated this week", tone: "success" },
  { label: "Deadlines within 7 days", value: "11", hint: "Action required", tone: "danger" },
];

export default function InsightsPage() {
  return (
    <ModulePage
      title="Insights & Timeline"
      description="Review matter activity, legal signals, and strategic risk trends in one operating view."
      stats={stats}
      sections={[
        {
          title: "Matter intelligence",
          description: "Signals and recent events affecting active matters",
          content: (
            <div className="space-y-3">
              {[["Employment tribunal review", "2 key events added this week"], ["Contract expiry risk", "Negotiation window closing soon"], ["Regulatory filing reminder", "SOP and evidence package due"]].map(([title, detail]) => (
                <div key={title} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <Activity className="mt-0.5 size-4 text-primary" />
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
          title: "Upcoming events",
          description: "Recent timeline items and follow-up actions",
          content: (
            <div className="space-y-3">
              {[["Hearing schedule", "20 May 2026 · Kuala Lumpur High Court"], ["Client check-in", "22 May 2026 · 10:30 AM"], ["Contract review", "24 May 2026 · Procurement team"]].map(([label, when]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <Clock3 className="size-4 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{when}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
