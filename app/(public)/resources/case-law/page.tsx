import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Scale, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Case Law — Resources — ${BRAND.name}`,
  description: 'Curated Malaysian case law resources organized by practice area.',
};

const AREAS = [
  { name: 'Contracts', count: 45, desc: 'Contract formation, breach, remedies, and interpretation.' },
  { name: 'Employment', count: 32, desc: 'Wrongful dismissal, workplace discrimination, and employment benefits.' },
  { name: 'PDPA & Privacy', count: 18, desc: 'Data protection, consent, and privacy obligations.' },
  { name: 'Tenancy', count: 24, desc: 'Landlord-tenant disputes, eviction, and rental agreements.' },
  { name: 'Tort & Limitation', count: 28, desc: 'Negligence, defamation, and limitation periods.' },
  { name: 'Constitutional', count: 15, desc: 'Constitutional rights, judicial review, and fundamental liberties.' },
  { name: 'Company Law', count: 35, desc: 'Directors duties, shareholder rights, and corporate transactions.' },
  { name: 'Criminal', count: 40, desc: 'Criminal procedure, evidence, and sentencing.' },
  { name: 'Land Law', count: 30, desc: 'National Land Code, easements, and property disputes.' },
  { name: 'Syariah Family', count: 20, desc: 'Muslim family law, divorce, custody, and maintenance.' },
  { name: 'Administrative', count: 22, desc: 'Judicial review, mandamus, and government authority.' },
  { name: 'Insolvency', count: 16, desc: 'Bankruptcy, winding up, and debt recovery.' },
  { name: 'Intellectual Property', count: 14, desc: 'Patents, trademarks, copyright, and trade secrets.' },
];

export default function CaseLawPage() {
  return (
    <>
      <PageHeader
        title="Case Law Resources"
                description={`Curated Malaysian case law organized by practice area. Searchable through the ${BRAND.name} research engine.`}
        breadcrumbs={[
          { label: 'Resources', href: '/resources' },
          { label: 'Case Law' },
        ]}
        actions={
          <Button asChild>
            <Link href="/legalai/research">Search Case Law <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AREAS.map((area) => (
            <div key={area.name} className="rounded-lg border border-border/70 bg-card/50 p-4">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-semibold text-foreground text-sm">{area.name}</h4>
                <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">{area.count}</span>
              </div>
              <p className="text-xs text-muted-foreground">{area.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
