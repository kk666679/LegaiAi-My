import { Metadata } from 'next';
import { PageHeader, FeatureCard, Section } from '@/components/navigation/PageComponents';
import {
  Scale, Building2, Gavel, Briefcase, FileSignature, Shield,
  BookOpen, Database, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';

export const metadata: Metadata = {
  title: `Solutions — ${BRAND.name}`,
  description: 'Tailored AI solutions for law firms, in-house legal teams, litigation, corporate, and compliance workflows.',
};

const SOLUTIONS = [
  {
    icon: <Building2 className="size-5" />,
    title: 'Law Firms',
    description: 'Matter lifecycle, client management, legal research, drafting, billing intelligence, knowledge management, and team analytics.',
    href: '/solutions/law-firms',
    badge: 'Popular',
  },
  {
    icon: <Briefcase className="size-5" />,
    title: 'In-House Legal',
    description: 'Contract lifecycle, obligations tracking, risk monitoring, regulatory alerts, legal requests, and executive reporting.',
    href: '/solutions/in-house',
  },
  {
    icon: <Gavel className="size-5" />,
    title: 'Litigation',
    description: 'Case chronology, evidence management, authority research, argument preparation, debate simulation, and deadline monitoring.',
    href: '/solutions/litigation',
  },
  {
    icon: <FileSignature className="size-5" />,
    title: 'Corporate',
    description: 'Corporate documents, contracts, governance, compliance, risk management, and board/legal workflows.',
    href: '/solutions/corporate',
  },
  {
    icon: <Shield className="size-5" />,
    title: 'Compliance',
    description: 'Regulatory monitoring, framework mapping, obligations tracking, controls, evidence, alerts, and audit.',
    href: '/solutions/compliance',
  },
];

export default function SolutionsPage() {
  return (
    <>
      <PageHeader
        title="Solutions"
        description="Tailored AI solutions for every legal workflow. From solo practitioners to enterprise legal departments."
        breadcrumbs={[{ label: 'Solutions' }]}
        actions={
          <Button asChild>
            <Link href="/legalai">Open {BRAND.name} <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((solution) => (
            <FeatureCard
              key={solution.title}
              icon={solution.icon}
              title={solution.title}
              description={solution.description}
              href={solution.href}
              badge={solution.badge}
            />
          ))}
        </div>
      </Section>

      <Section title="Why LAW MATE" description="Built for the realities of Malaysian legal practice.">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-card/50 p-6">
            <h3 className="font-semibold text-foreground mb-2">Malaysian Context</h3>
            <p className="text-sm text-muted-foreground">
              Federal Court hierarchy, MLJ citations, PDPA compliance, Bursa ESG requirements, and Syariah law coverage.
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/50 p-6">
            <h3 className="font-semibold text-foreground mb-2">Human in Control</h3>
            <p className="text-sm text-muted-foreground">
              Six-level HITL authorization. No high-impact action executes without explicit human approval. Full audit trail.
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/50 p-6">
            <h3 className="font-semibold text-foreground mb-2">Evidence-First</h3>
            <p className="text-sm text-muted-foreground">
              Every AI conclusion linked to its evidence. Citations verified. Uncertainty acknowledged. Never fabricated.
            </p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Find your solution</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Every solution connects through one platform. Start with what matters most to your practice.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/platform">Explore Platform</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/legalai">Open Workspace</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
