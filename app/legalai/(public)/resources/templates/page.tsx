import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Templates — Resources — ${BRAND.name}`,
  description: 'Legal document templates for Malaysian practice.',
};

const TEMPLATES = [
  { name: 'Writ of Summons', desc: 'Civil procedure compliant writ with proper formatting.', type: 'Litigation' },
  { name: 'Affidavit', desc: 'Sworn statement template with jurat and exhibit marking.', type: 'Litigation' },
  { name: 'Submission', desc: 'Legal submission with IRAC structure and authority references.', type: 'Litigation' },
  { name: 'Demand Letter', desc: 'Pre-action demand letter with legal basis and deadline.', type: 'Correspondence' },
  { name: 'Legal Opinion', desc: 'Comprehensive legal opinion with issue analysis.', type: 'Advisory' },
  { name: 'Board Resolution', desc: 'Corporate board resolution template.', type: 'Corporate' },
  { name: 'Employment Contract', desc: 'Malaysian employment contract with EA compliance.', type: 'Employment' },
  { name: 'Commercial Lease', desc: 'Commercial property lease agreement.', type: 'Property' },
];

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Document Templates"
        description="Legal document templates for Malaysian practice. Used by the AI Drafting agent with citation validation."
        breadcrumbs={[
          { label: 'Resources', href: '/resources' },
          { label: 'Templates' },
        ]}
        actions={
          <Button asChild>
            <Link href="/platform/document-drafting">Open Drafting <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section>
        <div className="grid gap-3 sm:grid-cols-2">
          {TEMPLATES.map((tpl) => (
            <div key={tpl.name} className="flex items-center justify-between rounded-lg border border-border/70 bg-card/50 p-4">
              <div className="flex items-center gap-3">
                <FileText className="size-4 text-primary shrink-0" />
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{tpl.name}</h4>
                  <p className="text-xs text-muted-foreground">{tpl.desc}</p>
                </div>
              </div>
              <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground shrink-0">{tpl.type}</span>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
