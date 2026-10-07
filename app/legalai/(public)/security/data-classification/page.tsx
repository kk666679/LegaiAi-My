import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Database, Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Data Classification — Security — ${BRAND.name}`,
  description: 'Four data classifications with model restrictions and access controls.',
};

const CLASSIFICATIONS = [
  {
    level: 'PUBLIC',
    description: 'Published case law, legislation, publicly available legal materials.',
    color: 'border-emerald-500/30 bg-emerald-500/5',
    badgeColor: 'bg-emerald-500/10 text-emerald-600',
    models: 'All permitted models',
    restrictions: 'No restrictions on AI processing',
  },
  {
    level: 'INTERNAL',
    description: 'Non-client firm documents, internal communications, templates, procedures.',
    color: 'border-blue-500/30 bg-blue-500/5',
    badgeColor: 'bg-blue-500/10 text-blue-600',
    models: 'Llama 3.1 (local), GPT-4o (if enabled)',
    restrictions: 'Cannot be sent to unapproved external models',
  },
  {
    level: 'CONFIDENTIAL',
    description: 'Client matter information, case details, legal strategy, communications.',
    color: 'border-amber-500/30 bg-amber-500/5',
    badgeColor: 'bg-amber-500/10 text-amber-600',
    models: 'Llama 3.1 (local only)',
    restrictions: 'Must stay on local infrastructure. No external API calls.',
  },
  {
    level: 'PRIVILEGED',
    description: 'Attorney-client privileged material. Most sensitive legal communications.',
    color: 'border-red-500/30 bg-red-500/5',
    badgeColor: 'bg-red-500/10 text-red-600',
    models: 'Embeddings only (local)',
    restrictions: 'Only vector embeddings for search. No text processing by LLMs.',
  },
];

export default function DataClassificationPage() {
  return (
    <>
      <PageHeader
        title="Data Classification"
        description="Four-tier data classification with enforced model restrictions. The backend prevents unsafe model selection — the UI reflects these restrictions."
        breadcrumbs={[
          { label: 'Security', href: '/security' },
          { label: 'Data Classification' },
        ]}
        actions={
          <Button asChild>
            <Link href="/legalai/governance">AI Governance <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Classification Levels">
        <div className="space-y-4">
          {CLASSIFICATIONS.map((cls) => (
            <div key={cls.level} className={`rounded-xl border p-6 ${cls.color}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase ${cls.badgeColor}`}>
                    {cls.level}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{cls.description}</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase mb-1">Permitted Models</h4>
                  <p className="text-sm text-muted-foreground">{cls.models}</p>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-foreground uppercase mb-1">Restrictions</h4>
                  <p className="text-sm text-muted-foreground">{cls.restrictions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Enforcement">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-3">
              <Shield className="size-4 text-primary shrink-0 mt-0.5" />
              Backend enforces model restrictions at the API level — not just the UI
            </li>
            <li className="flex items-start gap-3">
              <Shield className="size-4 text-primary shrink-0 mt-0.5" />
              Data classification is set at ingestion and cannot be downgraded by AI
            </li>
            <li className="flex items-start gap-3">
              <Shield className="size-4 text-primary shrink-0 mt-0.5" />
              Privileged data never leaves local infrastructure — embeddings only
            </li>
            <li className="flex items-start gap-3">
              <Shield className="size-4 text-primary shrink-0 mt-0.5" />
              All classification changes are logged in the audit trail
            </li>
          </ul>
        </div>
      </Section>
    </>
  );
}
