import { ShieldCheck, Scale, Gavel, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "@/app/legalai/(dashboard)/_components/module-page";

const stats: ModuleStat[] = [
  { label: "Policies", value: "16", hint: "Active frameworks", tone: "default" },
  { label: "Exceptions", value: "2", hint: "Open review", tone: "warning" },
  { label: "Audit completion", value: "97%", hint: "Current cycle", tone: "success" },
  { label: "Escalations", value: "1", hint: "Critical", tone: "danger" },
];

export default function CompliancePage() {
  return (
    <ModulePage
      title="Compliance"
      description="Track ongoing compliance obligations, policy attestations, and legal controls across the firm and client work."
      stats={stats}
      sections={[
        {
          title: "Policy coverage",
          description: "Key control areas and attestation status",
          content: (
            <div className="space-y-3">
              {[["PDPA obligations", "Current"], ["AML & sanctions", "Current"], ["Conflict management", "Review due soon"]].map(([label, state]) => (
                <div key={label} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="size-4 text-primary" />
                    <span className="text-sm font-medium">{label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{state}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Review queue",
          description: "Items requiring legal or governance action",
          content: (
            <div className="space-y-3">
              {[["Data retention policy", "Awaiting board sign-off"], ["Client consent check", "Needs verification"], ["Third-party vendor review", "In progress"]].map(([task, note]) => (
                <div key={task} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <Gavel className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{task}</p>
                    <p className="text-xs text-muted-foreground">{note}</p>
                  </div>
                </div>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
