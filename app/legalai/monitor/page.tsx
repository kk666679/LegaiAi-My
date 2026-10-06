import { Bell, ShieldCheck, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "../_components/module-page";

const stats: ModuleStat[] = [
  { label: "Tracked updates", value: "84", hint: "Regulatory signals", tone: "default" },
  { label: "Matched alerts", value: "11", hint: "Relevant to active matters", tone: "success" },
  { label: "Awaiting review", value: "2", hint: "Needs legal triage", tone: "warning" },
  { label: "Critical updates", value: "1", hint: "Escalated", tone: "danger" },
];

export default function MonitorPage() {
  return (
    <ModulePage
      title="Change Monitor"
      description="Monitor evolving laws, regulations, and operational changes that may affect active matters."
      stats={stats}
      sections={[
        {
          title: "Monitor summary",
          description: "Recent legal developments and signal relevance",
          content: (
            <div className="space-y-3">
              {[["PDPA guidance update", "Relevant to 3 active client matters"], ["Employment Act modification", "Potential impact on staffing matters"], ["Construction tender rule change", "New procurement filing requirement"]].map(([title, detail]) => (
                <div key={title} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <Bell className="mt-0.5 size-4 text-primary" />
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
          title: "Compliance watchlist",
          description: "Priority items requiring action",
          content: (
            <div className="space-y-3">
              {[["Data retention policy review", "Board review due in 5 days"], ["Employment contract update", "Needs draft revision"], ["Licensing update monitor", "No action required yet"]].map(([label, note]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{note}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
