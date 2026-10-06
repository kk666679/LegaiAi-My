import Link from "next/link";
import { Building2, Search, FileText, Briefcase, ArrowRight } from "lucide-react";
import { ModulePage, type ModuleStat } from "../_components/module-page";

const stats: ModuleStat[] = [
  { label: "Active clients", value: "128", hint: "Across all matters", tone: "default" },
  { label: "New this month", value: "17", hint: "Pipeline growth", tone: "success" },
  { label: "Conflict checks", value: "9", hint: "Awaiting review", tone: "warning" },
  { label: "High risk", value: "3", hint: "Requires follow-up", tone: "danger" },
];

export default function ClientsPage() {
  return (
    <ModulePage
      title="Clients"
      description="Track client relationships, conflicts, and the matters tied to each engagement."
      actions={
        <div className="flex items-center gap-2">
          <Link href="/legalai/matters/new" className="inline-flex items-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Create matter</Link>
          <Link href="/legalai/search" className="inline-flex items-center rounded-md border px-3 py-2 text-sm font-medium">Search client records</Link>
        </div>
      }
      stats={stats}
      sections={[
        {
          title: "Client overview",
          description: "Core client management and engagement health",
          content: (
            <div className="space-y-3">
              {[["Kuala Lumpur Holdings", "Corporate · 4 active matters"], ["Citra Legal Advisory", "Private client · 2 active matters"], ["Sinar Enterprise", "Commercial disputes · 1 high-priority matter"]].map(([name, detail]) => (
                <div key={name} className="flex items-start justify-between gap-4 rounded-md border border-border/70 p-3">
                  <div className="flex items-center gap-3">
                    <Building2 className="size-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{name}</p>
                      <p className="text-xs text-muted-foreground">{detail}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          ),
        },
        {
          title: "Operational actions",
          description: "Workflows for onboarding and matter intake",
          content: (
            <div className="space-y-3">
              {[
                { label: "Add client", href: "/legalai/clients" },
                { label: "Run conflict check", href: "/legalai/matters/conflicts" },
                { label: "View documents", href: "/legalai/documents" },
              ].map(({ label, href }) => (
                <Link key={label} href={href} className="flex items-center justify-between rounded-md border border-border/70 p-3 text-sm font-medium hover:bg-accent/40">
                  <span className="flex items-center gap-2"><Search className="size-4 text-primary" />{label}</span>
                  <ArrowRight className="size-4 text-muted-foreground" />
                </Link>
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}
