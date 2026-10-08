import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Clock, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: `Changelog — Resources — ${BRAND.name}`,
  description: 'Platform updates, new features, and recent improvements.',
};

const CHANGES = [
  {
    version: '1.0.9',
    date: 'August 2026',
    type: 'minor',
    changes: [
      'Added Legal Insights & Timeline page',
      'Enhanced Universal Search with semantic capabilities',
      'Improved contract analysis with playbook deviation detection',
      'Added HITL approval workflow for drafting',
      'Performance improvements across all pages',
    ],
  },
  {
    version: '1.0.8',
    date: 'July 2026',
    type: 'minor',
    changes: [
      'Added multi-agent debate simulation',
      'Enhanced risk intelligence with evidence-linked scores',
      'Added PDPA 2025 compliance framework',
      'Improved citation verification accuracy',
      'Added executive analytics dashboard',
    ],
  },
  {
    version: '1.0.0',
    date: 'June 2026',
    type: 'major',
    changes: [
      `Initial release of ${BRAND.name}`,
      '12 AI agents with BullMQ orchestration',
      'Full matter management lifecycle',
      'Contract intelligence and analysis',
      'Legal research with pgVector semantic search',
      'Document drafting with citation validation',
      'Human-in-the-loop authorization framework',
      'AI governance and model registry',
      'Malaysian jurisdiction support',
    ],
  },
];

export default function ChangelogPage() {
  return (
    <>
      <PageHeader
        title="Changelog"
                description={`Platform updates, new features, and improvements to ${BRAND.name}.`}
        breadcrumbs={[
          { label: 'Resources', href: '/resources' },
          { label: 'Changelog' },
        ]}
      />

      <Section>
        <div className="space-y-8">
          {CHANGES.map((release) => (
            <div key={release.version} className="rounded-xl border border-border/70 bg-card/50 p-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-bold text-foreground">v{release.version}</h3>
                <Badge variant={release.type === 'major' ? 'default' : 'secondary'} className="text-xs">
                  {release.type}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5" />
                  {release.date}
                </span>
              </div>
              <ul className="space-y-2">
                {release.changes.map((change, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-primary/50 shrink-0 mt-1.5" />
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
