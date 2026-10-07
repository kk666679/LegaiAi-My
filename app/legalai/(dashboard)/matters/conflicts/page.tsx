import { AlertTriangle, ShieldCheck, Scale, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "../../_components/module-page";

const stats: ModuleStat[] = [
  { label: "Open risks", value: "18", hint: "Across active matters", tone: "default" },
  { label: "High severity", value: "5", hint: "Needs escalation", tone: "danger" },
  { label: "Mitigations active", value: "14", hint: "Controls in place", tone: "success" },
  { label: "Review due", value: "3", hint: "Within 7 days", tone: "warning" },
];

export default function RiskPage() {
  return (
    <ModulePage
      title="Risk Engine"
      description="Assess operational, legal, and regulatory exposure for matters, contracts, and client portfolios."
      stats={stats}
      sections={[
        {
          title: "Risk profile",
          description: "Exposure by matter and practice area",
          content: (
            <div className="space-y-3">
              {[["Commercial dispute", "High · timing exposure"], ["Employment review", "Moderate · policy gap"], ["Data compliance", "High · retention issue"]].map(([name, severity]) => (
                <div key={name} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-primary" />
                    <span className="text-sm font-medium">{name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{severity}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Risk controls",
          description: "Operational steps and mitigation actions",
          content: (
            <div className="space-y-3">
              {[["Redline review", "Partner sign-off required"], ["Escalation matrix", "Updated for active matters"], ["Contract insurance", "Coverage validated"]].map(([text, note]) => (
                <div key={text} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="text-sm font-medium">{text}</span>
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
