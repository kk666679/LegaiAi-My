import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, FeatureCard, Section } from '@/components/navigation/PageComponents';
import {
  FileText, CheckCircle2, Clock, Shield, ArrowRight, Bot,
  Scale, AlertTriangle, History, FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Document Drafting — ${BRAND.name}`,
  description: 'AI-assisted legal document drafting with citation validation, version control, and human review workflow.',
};

export default function DocumentDraftingPage() {
  return (
    <>
      <PageHeader
        title="Document Drafting"
        description="AI-assisted drafting for Writs, Affidavits, Submissions, Letters, and more. Every draft validated, versioned, and reviewed before use."
        breadcrumbs={[
          { label: 'Platform', href: '/platform' },
          { label: 'Document Drafting' },
        ]}
        actions={
          <Button asChild>
            <Link href="/platform/document-drafting">Open Drafting Studio <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Document Types">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Writ of Summons', desc: 'Civil procedure compliant writs with proper formatting and court requirements.' },
            { title: 'Affidavit', desc: 'Sworn statements with proper jurat, exhibit marking, and deponent details.' },
            { title: 'Submission', desc: 'Legal submissions with IRAC structure, authorities, and structured arguments.' },
            { title: 'Legal Opinion', desc: 'Comprehensive legal opinions with issue analysis, authorities, and conclusions.' },
            { title: 'Demand Letter', desc: 'Pre-action demand letters with proper legal basis and deadline framing.' },
            { title: 'Contract', desc: 'Contract drafting from templates with clause library and playbook integration.' },
            { title: 'Memorandum', desc: 'Internal legal memoranda with structured analysis and recommendations.' },
            { title: 'Internal Note', desc: 'Case notes, research summaries, and internal legal communications.' },
          ].map((doc) => (
            <div key={doc.title} className="rounded-lg border border-border/70 bg-card/50 p-4">
              <h4 className="font-semibold text-foreground text-sm mb-1">{doc.title}</h4>
              <p className="text-xs text-muted-foreground">{doc.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Drafting Workflow">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <div className="grid gap-4 md:grid-cols-6">
            {[
              { step: '1', title: 'Matter', desc: 'Select the matter and context' },
              { step: '2', title: 'Type', desc: 'Choose document type' },
              { step: '3', title: 'Evidence', desc: 'Select supporting evidence' },
              { step: '4', title: 'AI Draft', desc: 'AI generates first draft' },
              { step: '5', title: 'Review', desc: 'Human reviews and edits' },
              { step: '6', title: 'Export', desc: 'Approved version exported' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                  {item.step}
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Safeguards">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-card/50 p-6">
            <CheckCircle2 className="size-5 text-emerald-500 mb-3" />
            <h4 className="font-semibold text-foreground text-sm mb-1">Citation Validation</h4>
            <p className="text-xs text-muted-foreground">Every citation in the draft is verified against the database before export.</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/50 p-6">
            <History className="size-5 text-blue-500 mb-3" />
            <h4 className="font-semibold text-foreground text-sm mb-1">Version Control</h4>
            <p className="text-xs text-muted-foreground">Full version history with reviewer comments, timestamps, and change tracking.</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/50 p-6">
            <Shield className="size-5 text-primary mb-3" />
            <h4 className="font-semibold text-foreground text-sm mb-1">Human Review Required</h4>
            <p className="text-xs text-muted-foreground">No draft leaves the system without explicit human review and approval.</p>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Draft with confidence</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Every draft validated, every citation verified, every version tracked. AI assists — humans decide.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/platform/document-drafting">Open Drafting Studio</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/platform">Back to Platform</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
