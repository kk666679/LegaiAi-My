import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, FeatureCard, Section } from '@/components/navigation/PageComponents';
import {
  BookOpen, Search, Scale, CheckCircle2, Shield, Brain,
  ArrowRight, AlertTriangle, Database, Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Legal Research — ${BRAND.name}`,
  description: 'Evidence-first legal research with semantic search, citation verification, and IRAC analysis for Malaysian law.',
};

export default function LegalResearchPage() {
  return (
    <>
      <PageHeader
        title="Legal Research"
        description="Evidence-first legal research powered by pgVector semantic search, hybrid retrieval, and citation verification. Every conclusion linked to its source."
        breadcrumbs={[
          { label: 'Platform', href: '/platform' },
          { label: 'Legal Research' },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate/research">Start Research <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Research Capabilities">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Search className="size-5" />}
            title="Natural Language Queries"
            description="Ask legal questions in plain language. AI understands Malaysian legal context, jurisdiction, and court hierarchy."
          />
          <FeatureCard
            icon={<Database className="size-5" />}
            title="Hybrid Retrieval"
            description="Combines semantic vector search with keyword matching. 1536-dimension embeddings for deep contextual understanding."
          />
          <FeatureCard
            icon={<Scale className="size-5" />}
            title="Citation Verification"
            description="Every citation checked against the database. Unverified authorities flagged clearly — never presented as fact."
          />
          <FeatureCard
            icon={<CheckCircle2 className="size-5" />}
            title="IRAC Analysis"
            description="Structured Issue → Law → Analysis → Conclusion format. Each section grounded in verified evidence."
          />
          <FeatureCard
            icon={<Globe className="size-5" />}
            title="Malaysian Jurisdiction"
            description="Federal Court, Court of Appeal, High Court, Sessions Court. Civil, criminal, Syariah, and regulatory coverage."
          />
          <FeatureCard
            icon={<AlertTriangle className="size-5" />}
            title="Evidence Confidence"
            description="Confidence scoring for every conclusion. Clear distinction between verified evidence, AI analysis, and insufficient evidence."
          />
        </div>
      </Section>

      <Section title="Evidence UX">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <p className="text-sm text-muted-foreground mb-6">
            Every research result clearly distinguishes between three categories:
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <h4 className="font-semibold text-emerald-600 text-sm mb-1">✓ Verified Evidence</h4>
              <p className="text-xs text-muted-foreground">Citation confirmed in database. Source document identified. Confidence high.</p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
              <h4 className="font-semibold text-amber-600 text-sm mb-1">⚡ AI Analysis</h4>
              <p className="text-xs text-muted-foreground">Reasoning applied to verified evidence. Clearly marked as AI-generated interpretation.</p>
            </div>
            <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
              <h4 className="font-semibold text-red-600 text-sm mb-1">✗ Insufficient Evidence</h4>
              <p className="text-xs text-muted-foreground">Cannot verify. System states: &ldquo;Insufficient verified evidence.&rdquo;</p>
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Research with confidence</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Every conclusion linked to its evidence. Every citation verified. Never fabricate — always prove.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild>
              <Link href="/lawmate/research">Start Legal Research</Link>
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
