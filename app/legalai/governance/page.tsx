import { Cpu, Lock, ShieldCheck, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "@/app/legalai/(dashboard)/_components/module-page";

const stats: ModuleStat[] = [
  { label: "Model usage", value: "1,482", hint: "Requests this month", tone: "default" },
  { label: "Security events", value: "7", hint: "Reviewed", tone: "warning" },
  { label: "Policy compliance", value: "98%", hint: "Current baseline", tone: "success" },
  { label: "Kill switches", value: "3", hint: "Active safeguards", tone: "default" },
];

export default function GovernancePage() {
  return (
    <ModulePage
      title="AI Governance"
      description="Monitor model usage, policy controls, and security posture across the legal AI platform."
      stats={stats}
      sections={[
        {
          title: "Governance controls",
          description: "Operational safeguards and model restrictions",
          content: (
            <div className="space-y-3">
              {[["Model restrictions", "Client data stays limited to approved models"], ["Audit logging", "All high-impact actions are traceable"], ["HITL approvals", "High-risk actions require review"]].map(([label, detail]) => (
                <div key={label} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <Cpu className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Policy posture",
          description: "Current enforcement checks",
          content: (
            <div className="space-y-3">
              {[["RBAC enforcement", "Enabled"], ["Credential controls", "In place"], ["Data classification", "Validated"]].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <Lock className="size-4 text-primary" />
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
