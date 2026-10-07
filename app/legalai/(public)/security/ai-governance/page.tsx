import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Eye, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `AI Governance — Security — ${BRAND.name}`,
  description: 'Model registry, hallucination detection, kill switch, and AI governance policies.',
};

export default function AIGovernancePage() {
  return (
    <>
      <PageHeader
        title="AI Governance"
        description="Model registry, data classification enforcement, hallucination detection, cost tracking, and emergency kill switch. Every AI action is governed."
        breadcrumbs={[
          { label: 'Security', href: '/security' },
          { label: 'AI Governance' },
        ]}
        actions={
          <Button asChild>
            <Link href="/legalai/governance">Open Governance <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Governance Components">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: <Eye className="size-5" />, title: 'Model Registry', desc: 'Track active models, versions, allowed data classes, and performance metrics.' },
            { icon: <Shield className="size-5" />, title: 'Hallucination Detection', desc: 'Validation agent checks every AI output against verified sources. Flagged outputs blocked.' },
            { icon: <AlertTriangle className="size-5" />, title: 'Kill Switch', desc: 'Emergency AI shutdown capability. Requires appropriate authorization level.' },
            { icon: <Eye className="size-5" />, title: 'Cost Tracking', desc: 'Monitor AI infrastructure costs, token usage, and model efficiency per matter.' },
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

      <Section title="AI Governance Policies">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <ul className="space-y-3 text-sm text-muted-foreground">
            {[
              'All AI models must be registered before use',
              'Data classification determines which models can process data',
              'Hallucination events are logged and trigger review',
              'Cost anomalies trigger alerts to administrators',
              'Kill switch requires L3+ authorization',
              'Model updates require governance approval',
              'AI actions are never executed without audit logging',
            ].map((policy, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="size-1.5 rounded-full bg-primary/50 shrink-0 mt-1.5" />
                {policy}
              </li>
            ))}
          </ul>
        </div>
      </Section>
    </>
  );
}
