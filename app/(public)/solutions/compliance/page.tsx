import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import {
  Shield, Bell, Scale, CheckCircle2, FileText,
  AlertTriangle, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Compliance — ${BRAND.name}`,
  description: 'Regulatory monitoring, framework mapping, obligations tracking, and compliance intelligence.',
};

export default function CompliancePage() {
  return (
    <>
      <PageHeader
        title="Compliance"
        description="Regulatory monitoring, framework mapping, obligations tracking, controls, evidence, alerts, and audit — built for Malaysian compliance requirements."
        breadcrumbs={[
          { label: 'Solutions', href: '/solutions' },
          { label: 'Compliance' },
        ]}
        actions={
          <Button asChild>
            <Link href="/legalai/hitl">Open Compliance <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Compliance Capabilities">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: <Bell className="size-5" />, title: 'Regulatory Monitoring', desc: 'Automatic detection of regulatory changes affecting your practice areas and jurisdictions.' },
            { icon: <Scale className="size-5" />, title: 'Framework Mapping', desc: 'Map obligations to regulatory frameworks. Track compliance status across PDPA, CSA, Bursa, and more.' },
            { icon: <CheckCircle2 className="size-5" />, title: 'Obligations Tracking', desc: 'Extract and track compliance obligations. Never miss a filing, notification, or requirement.' },
            { icon: <FileText className="size-5" />, title: 'Evidence & Audit', desc: 'Every compliance action logged. Evidence-linked controls with immutable audit trail.' },
            { icon: <AlertTriangle className="size-5" />, title: 'Gap Analysis', desc: 'Identify compliance gaps against regulatory frameworks. Prioritized remediation with evidence.' },
            { icon: <Shield className="size-5" />, title: 'AI Governance', desc: 'Model registry, data classification, hallucination detection, and kill switch for AI systems.' },
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

      <Section title="Supported Frameworks">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { name: 'PDPA 2025', desc: 'Personal Data Protection Act' },
            { name: 'Cyber Security Act', desc: 'Incident reporting and governance' },
            { name: 'Bursa ESG', desc: 'Sustainability disclosures' },
            { name: 'SC Guidelines', desc: 'Securities Commission requirements' },
          ].map((fw) => (
            <div key={fw.name} className="rounded-lg border border-border/70 bg-card/50 p-4">
              <h4 className="font-semibold text-foreground text-sm">{fw.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{fw.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Stay compliant</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Regulatory changes detected automatically. Obligations tracked. Gaps identified. Audit ready.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/legalai/hitl">Open Compliance</Link></Button>
            <Button asChild variant="outline"><Link href="/legalai/agents/live">Regulatory Monitor</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
