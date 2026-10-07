import { Receipt, CircleDollarSign, Briefcase, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "@/app/legalai/(dashboard)/_components/module-page";

const stats: ModuleStat[] = [
  { label: "Total billable", value: "RM 128.4k", hint: "Current cycle", tone: "default" },
  { label: "AI suggestions", value: "23", hint: "Awaiting approval", tone: "warning" },
  { label: "Approved", value: "RM 96.3k", hint: "This month", tone: "success" },
  { label: "Outstanding", value: "RM 14.9k", hint: "Not yet invoiced", tone: "danger" },
];

export default function BillingPage() {
  return (
    <ModulePage
      title="Billing Intelligence"
      description="Review time entries, AI-assisted billing suggestions, and outstanding activities tied to matters."
      stats={stats}
      sections={[
        {
          title: "Billing overview",
          description: "Key client and matter entries",
          content: (
            <div className="space-y-3">
              {[["Kuala Lumpur Holdings", "RM 28.4k · 4 matters"], ["Citra Legal Advisory", "RM 16.2k · 2 matters"], ["Sinar Enterprise", "RM 12.7k · 3 matters"]].map(([client, detail]) => (
                <div key={client} className="flex items-center justify-between rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-2">
                    <Receipt className="size-4 text-primary" />
                    <span className="text-sm font-medium">{client}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{detail}</span>
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Approval queue",
          description: "AI-assisted time entries pending validation",
          content: (
            <div className="space-y-3">
              {[["Employment review", "AI suggestion · 6.5h"], ["Commercial contract redraft", "AI suggestion · 4.0h"], ["Due diligence file", "Awaiting partner approval"]].map(([entry, detail]) => (
                <div key={entry} className="flex items-start gap-3 rounded-md border border-border/70 p-3">
                  <CircleDollarSign className="mt-0.5 size-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium">{entry}</p>
                    <p className="text-xs text-muted-foreground">{detail}</p>
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
