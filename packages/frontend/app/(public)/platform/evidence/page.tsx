import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, BarChart3, Link2 } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { PageHeader, Section } from "@/components/navigation/PageComponents";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: `Evidence Management — Platform — ${BRAND.name}`,
  description:
    "Keep legal research findings connected to their sources, citations, and verification status.",
};

const CAPABILITIES = [
  {
    icon: <Link2 className="size-5" />,
    title: "Source-linked findings",
    description:
      "Research results retain references to the authorities and source material used to support each finding.",
  },
  {
    icon: <BookOpen className="size-5" />,
    title: "Citation verification",
    description:
      "Citations have a verification state so unverified authorities are not presented as confirmed evidence.",
  },
  {
    icon: <BarChart3 className="size-5" />,
    title: "Evidence-aware analysis",
    description:
      "Research workflows distinguish source evidence from AI analysis and make confidence visible alongside the result.",
  },
];

export default function EvidenceManagementPage() {
  return (
    <>
      <PageHeader
        title="Evidence Management"
        description="Keep legal research grounded in identifiable sources. Findings, citations, and analysis remain connected so legal teams can review the material behind an answer."
        breadcrumbs={[
          { label: "Platform", href: "/platform" },
          { label: "Evidence Management" },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate/research">
              Explore legal research <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        }
      />

      <Section
        title="Evidence stays reviewable"
        description="The research workspace presents the source trail with the analysis, making it easier to verify what supports a conclusion."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {CAPABILITIES.map((capability) => (
            <div
              key={capability.title}
              className="rounded-xl border border-border/70 bg-card/50 p-6"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-2.5 text-primary">
                {capability.icon}
              </div>
              <h2 className="font-semibold text-foreground">{capability.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {capability.description}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground">Research with a source trail</h2>
          <p className="mx-auto mb-6 mt-3 max-w-2xl text-muted-foreground">
            Explore research results, authorities, citations, and reasoning in the LawMate workspace.
          </p>
          <Button asChild>
            <Link href="/lawmate/research">
              Start legal research <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </Section>
    </>
  );
}
