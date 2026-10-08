import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Legal Guides — Resources — ${BRAND.name}`,
  description: 'Malaysian legal practice guides covering civil litigation, corporate law, and regulatory compliance.',
};

const GUIDES = [
  { title: 'Civil Litigation Guide', desc: 'Federal Court hierarchy, civil procedure, and litigation workflow in Malaysia.', area: 'Litigation' },
  { title: 'Contract Law Essentials', desc: 'Contracts Act 1950, key clauses, and common disputes in Malaysian commercial practice.', area: 'Contract' },
  { title: 'PDPA Compliance Guide', desc: 'Personal Data Protection Act 2010 (as amended 2025) compliance requirements.', area: 'Privacy' },
  { title: 'Corporate Governance', desc: 'Companies Act 2016, board duties, and corporate governance frameworks.', area: 'Corporate' },
  { title: 'Employment Law', desc: 'Employment Act 1955, industrial relations, and workplace compliance.', area: 'Employment' },
  { title: 'Land Law & Conveyancing', desc: 'National Land Code 1965, conveyancing procedures, and property transactions.', area: 'Property' },
  { title: 'Criminal Procedure', desc: 'Criminal Procedure Code, arrest procedures, and trial process.', area: 'Criminal' },
  { title: 'Syariah Family Law', desc: 'Muslim family law, divorce proceedings, and custody matters.', area: 'Family' },
];

export default function LegalGuidesPage() {
  return (
    <>
      <PageHeader
        title="Legal Guides"
        description="Practical guides for Malaysian legal practice. From civil litigation to Syariah family law."
        breadcrumbs={[
          { label: 'Resources', href: '/resources' },
          { label: 'Legal Guides' },
        ]}
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2">
          {GUIDES.map((guide) => (
            <div key={guide.title} className="rounded-lg border border-border/70 bg-card/50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="size-4 text-primary" />
                <h4 className="font-semibold text-foreground text-sm">{guide.title}</h4>
                <span className="ml-auto rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{guide.area}</span>
              </div>
              <p className="text-sm text-muted-foreground">{guide.desc}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
