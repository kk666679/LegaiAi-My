import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import {
  FileSignature, AlertTriangle, Scale, Bell, BarChart3,
  Shield, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `In-House Legal — ${BRAND.name}`,
  description: 'Contract lifecycle, obligations, risk monitoring, and executive reporting for in-house legal teams.',
};

export default function InHousePage() {
  return (
    <>
      <PageHeader
        title="In-House Legal"
        description="Contract lifecycle management, obligations tracking, risk monitoring, regulatory alerts, and executive reporting — purpose-built for in-house legal teams."
        breadcrumbs={[
          { label: 'Solutions', href: '/solutions' },
          { label: 'In-House Legal' },
        ]}
        actions={
          <Button asChild>
            <Link href="/legalai">Open {BRAND.name} <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="What You Get">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: <FileSignature className="size-5" />, title: 'Contract Lifecycle', desc: 'Upload, analyze, track obligations, monitor renewals, and manage your contract portfolio with AI.' },
            { icon: <Scale className="size-5" />, title: 'Obligations Tracking', desc: 'Extract and track obligations across all contracts. Never miss a deadline or compliance requirement.' },
            { icon: <AlertTriangle className="size-5" />, title: 'Risk Monitoring', desc: 'Proactive risk alerts across contracts, compliance, and regulatory changes. Evidence-grounded scores.' },
            { icon: <Bell className="size-5" />, title: 'Regulatory Alerts', desc: 'Automatic monitoring of regulatory changes affecting your industry. Configurable alerts and subscriptions.' },
            { icon: <BarChart3 className="size-5" />, title: 'Executive Reporting', desc: 'Board-ready reports on legal risk, contract portfolio health, and team performance.' },
            { icon: <Shield className="size-5" />, title: 'Compliance Framework', desc: 'Map obligations to regulatory frameworks. Track compliance status and remediation progress.' },
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
          <h2 className="text-2xl font-bold text-foreground mb-3">Streamline legal operations</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            From contract intake to board reporting, AI handles the operational workload so your team can focus on judgment.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/legalai/contracts">Contract Intelligence</Link></Button>
            <Button asChild variant="outline"><Link href="/legalai/compliance">Compliance</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
