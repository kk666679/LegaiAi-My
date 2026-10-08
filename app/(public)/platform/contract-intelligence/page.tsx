import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, FeatureCard, Section } from '@/components/navigation/PageComponents';
import {
  FileSignature, AlertTriangle, CheckCircle2, Scale, Search,
  MessageSquare, FileText, ArrowRight, Bot, Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Contract Intelligence — ${BRAND.name}`,
  description: 'Upload, analyze, and redline contracts with AI. Extract key terms, detect risk, and chat with your contracts.',
};

export default function ContractIntelligencePage() {
  return (
    <>
      <PageHeader
        title="Contract Intelligence"
        description="Upload contracts and let AI extract key terms, identify risks, detect playbook deviations, and generate redlines — with human verification at every step."
        breadcrumbs={[
          { label: 'Platform', href: '/platform' },
          { label: 'Contract Intelligence' },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate/contracts">Open Contract Analyzer <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Analysis Capabilities">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<FileSignature className="size-5" />}
            title="Clause Extraction"
            description="Automatically extract and categorize clauses — termination, indemnity, liability, confidentiality, governing law."
          />
          <FeatureCard
            icon={<AlertTriangle className="size-5" />}
            title="Risk Heatmap"
            description="Visual risk assessment across contract clauses. High-risk areas highlighted with explanations and source references."
          />
          <FeatureCard
            icon={<CheckCircle2 className="size-5" />}
            title="Playbook Deviation"
            description="Compare contracts against your firm's standard playbook. Flag deviations and missing clauses automatically."
          />
          <FeatureCard
            icon={<Scale className="size-5" />}
            title="Obligation Tracking"
            description="Extract obligations, deadlines, and renewal dates. Track compliance across your contract portfolio."
          />
          <FeatureCard
            icon={<MessageSquare className="size-5" />}
            title="AI Chat"
            description="Ask questions about any contract in natural language. Get answers grounded in the actual contract text."
          />
          <FeatureCard
            icon={<FileText className="size-5" />}
            title="Redline Generation"
            description="AI-generated redlines with tracked changes, comments, and explanations for each suggested modification."
          />
        </div>
      </Section>

      <Section title="Contract Analysis Workflow">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <div className="grid gap-4 md:grid-cols-5">
            {[
              { step: '1', title: 'Upload', desc: 'PDF, DOCX, or paste text' },
              { step: '2', title: 'Analyze', desc: 'AI extracts terms and assesses risk' },
              { step: '3', title: 'Review', desc: 'Human verifies findings' },
              { step: '4', title: 'Redline', desc: 'AI generates suggested changes' },
              { step: '5', title: 'Export', desc: 'Approved analysis and redlines' },
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

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Analyze your first contract</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Upload a contract and see AI-powered analysis with risk scoring, clause extraction, and playbook comparison.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/lawmate/contracts">Open Contract Analyzer</Link>
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
