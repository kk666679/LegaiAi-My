import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, Network, ShieldCheck } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { PageHeader, Section } from "@/components/navigation/PageComponents";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Tenant Isolation — Security — ${BRAND.name}`,
  description:
    "How LawMate scopes legal work and AI operations to the correct organisation and permissions.",
};

const CONTROLS = [
  {
    icon: <Network className="size-5" />,
    title: "Organisation-scoped access",
    description:
      "Requests are evaluated in the context of the authenticated organisation and the user's permissions before matter or document data is returned.",
  },
  {
    icon: <Database className="size-5" />,
    title: "Scoped AI workflows",
    description:
      "Retrieval and downstream analysis use the authorised context for the request, so one organisation's matter information is not used to answer another organisation's query.",
  },
  {
    icon: <ShieldCheck className="size-5" />,
    title: "Governed actions",
    description:
      "Permission checks, data classification rules, and human approval requirements continue to apply when an AI workflow prepares or executes an action.",
  },
];

export default function TenantIsolationPage() {
  return (
    <>
      <PageHeader
        title="Tenant Isolation"
        description="Legal work stays within the organisation and permissions that authorised it. Tenant boundaries apply to application data access and AI-assisted workflows."
        breadcrumbs={[
          { label: "Security", href: "/security" },
          { label: "Tenant Isolation" },
        ]}
        actions={
          <Button asChild>
            <Link href="/security/rbac">
              Review access controls <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
      />

      <Section
        title="How the boundary is maintained"
        description="Organisation context is part of the access decision across the legal workspace and its AI features."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {CONTROLS.map((control) => (
            <div
              key={control.title}
              className="rounded-xl border border-border/70 bg-card/50 p-6"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
                {control.icon}
              </div>
              <h2 className="font-semibold text-foreground">{control.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {control.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Security controls work together</h2>
          <p className="mx-auto mb-6 mt-3 max-w-2xl text-muted-foreground">
            Tenant scoping complements role-based access, data classification, and audit logging.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild>
              <Link href="/security/rbac">Role-based access</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/security/data-classification">Data classification</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/security/audit">Audit trail</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
