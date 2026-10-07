import { BarChart3, TrendingUp, Database, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "@/app/legalai/(dashboard)/_components/module-page";

const stats: ModuleStat[] = [
  { label: "AI ROI", value: "3.8x", hint: "Improvement vs baseline", tone: "success" },
  { label: "Active usage", value: "84%", hint: "Team adoption", tone: "default" },
  { label: "Matter velocity", value: "+22%", hint: "Compared to last month", tone: "success" },
  { label: "Risk exposure", value: "6.2%", hint: "Portfolio coverage", tone: "warning" },
];

export default function AnalyticsPage() {
  return (
    <ModulePage
      title="Executive Analytics"
      description="Review AI usage, matter productivity, and operational signals across the legal practice."
      stats={stats}
      sections={[
        {
          title: "Performance indicators",
          description: "Firm-level measures and trends",
          content: (
            <div className="space-y-3">
              {[["Legal research efficiency", "+31%"], ["Draft turnaround", "+24%"], ["Client deliverable cycle", "+18%"]].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="size-4 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Operational data",
          description: "Cross-functional productivity and coverage",
          content: (
            <div className="space-y-3">
              {[["Automation coverage", "71%"], ["Knowledge retrieval adoption", "92%"], ["Document processing latency", "<2hr"]].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <Database className="size-4 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{value}</span>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
