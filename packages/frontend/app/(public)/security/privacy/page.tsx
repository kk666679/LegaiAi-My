import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Privacy — Security — ${BRAND.name}`,
  description: 'PII redaction, consent management, data minimisation, and PDPA compliance.',
};

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Controls"
        description="PII redaction, consent management, data minimisation, and PDPA compliance. Privacy by design, not as an afterthought."
        breadcrumbs={[
          { label: 'Security', href: '/security' },
          { label: 'Privacy' },
        ]}
      />

      <Section title="Privacy Capabilities">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: 'PII Redaction', desc: 'Automatic detection and redaction of personally identifiable information in AI processing.' },
            { title: 'Consent Management', desc: 'Track user consent for LLM processing, data region preferences, and draft permissions.' },
            { title: 'Data Minimisation', desc: 'Only necessary data is sent to AI models. Context is scoped to the current operation.' },
            { title: 'PDPA Compliance', desc: 'Support for PDPA 2025 requirements including forget-user and data portability.' },
            { title: 'Cross-Border Controls', desc: 'Data residency controls ensure sensitive data stays within approved jurisdictions.' },
            { title: 'Access Logging', desc: 'Every data access is logged. Who accessed what, when, and for what purpose.' },
          ].map((item) => (
            <div key={item.title} className="flex gap-4 rounded-lg border border-border/70 bg-card/50 p-5">
              <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">
                <Shield className="size-5" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
