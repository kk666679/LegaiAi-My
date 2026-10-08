import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import {
  Building2, FileSignature, Shield, Scale, BarChart3,
  Users, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Corporate — ${BRAND.name}`,
  description: 'Corporate documents, contracts, governance, compliance, and risk management for legal departments.',
};

export default function CorporatePage() {
  return (
    <>
      <PageHeader
        title="Corporate Legal"
        description="Corporate documents, contract management, governance frameworks, compliance tracking, and risk intelligence for legal departments."
        breadcrumbs={[
          { label: 'Solutions', href: '/solutions' },
          { label: 'Corporate' },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate">Open {BRAND.name} <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Corporate Capabilities">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: <Building2 className="size-5" />, title: 'Corporate Documents', desc: 'Board resolutions, constitutional documents, and corporate filings with version control.' },
            { icon: <FileSignature className="size-5" />, title: 'Contract Management', desc: 'Portfolio-wide contract analysis, obligation tracking, and renewal monitoring.' },
            { icon: <Shield className="size-5" />, title: 'Governance Framework', desc: 'Board governance, compliance frameworks, and regulatory obligation mapping.' },
            { icon: <Scale className="size-5" />, title: 'Risk Intelligence', desc: 'Corporate risk scoring, evidence-grounded alerts, and proactive risk management.' },
            { icon: <BarChart3 className="size-5" />, title: 'Executive Reporting', desc: 'Board-ready reports on legal risk, compliance status, and portfolio health.' },
            { icon: <Users className="size-5" />, title: 'Team Management', desc: 'Matter assignment, utilization tracking, and workload distribution.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-lg border border-border/70 bg-card/50 p-5">
              <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">{item.icon}</div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Streamline corporate legal</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            From boardroom to contract room, AI handles the operational load while your team drives strategy.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/lawmate/contracts">Contract Intelligence</Link></Button>
            <Button asChild variant="outline"><Link href="/lawmate/agents/audit">AI Governance</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
