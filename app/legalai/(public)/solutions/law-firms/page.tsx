import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import {
  Building2, Briefcase, BookOpen, FileText, DollarSign,
  BarChart3, Shield, Users, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Law Firms — ${BRAND.name}`,
  description: 'AI-powered legal operations for law firms. Matter management, research, drafting, billing, and knowledge management.',
};

export default function LawFirmsPage() {
  return (
    <>
      <PageHeader
        title="For Law Firms"
        description="Streamline your firm's operations with AI-powered matter management, research, drafting, billing intelligence, and knowledge management."
        breadcrumbs={[
          { label: 'Solutions', href: '/solutions' },
          { label: 'Law Firms' },
        ]}
        actions={
          <Button asChild>
            <Link href="/legalai">Open {BRAND.name} <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Key Capabilities">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: <Briefcase className="size-5" />, title: 'Matter Lifecycle', desc: 'Full matter management from intake to closure with risk scores, deadlines, and AI insights.' },
            { icon: <Users className="size-5" />, title: 'Client Management', desc: 'Client registry with conflict checking, matter history, and relationship tracking.' },
            { icon: <BookOpen className="size-5" />, title: 'Legal Research', desc: 'Evidence-first research with semantic search, citation verification, and IRAC analysis.' },
            { icon: <FileText className="size-5" />, title: 'AI Drafting', desc: 'Writs, affidavits, submissions, and letters with citation validation and version control.' },
            { icon: <DollarSign className="size-5" />, title: 'Billing Intelligence', desc: 'AI-assisted time suggestions, anomaly detection, and matter profitability analysis.' },
            { icon: <BarChart3 className="size-5" />, title: 'Team Analytics', desc: 'Utilization tracking, workload distribution, and performance metrics.' },
            { icon: <Shield className="size-5" />, title: 'AI Governance', desc: 'Model registry, data classification, hallucination detection, and kill switch.' },
            { icon: <Building2 className="size-5" />, title: 'Knowledge Management', desc: 'Institutional knowledge capture, template library, and precedent management.' },
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

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Transform your firm</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Start with the workflow that matters most. Every feature connects through one coherent platform.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/legalai/matters">Manage Matters</Link></Button>
            <Button asChild variant="outline"><Link href="/legalai/research">Legal Research</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
