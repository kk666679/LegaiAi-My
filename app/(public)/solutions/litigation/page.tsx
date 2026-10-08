import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import {
  Gavel, Clock, BookOpen, Swords, FileText, Bell,
  Shield, Scale, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Litigation — ${BRAND.name}`,
  description: 'Case chronology, evidence, research, argument preparation, debate simulation, and deadline monitoring for litigation.',
};

export default function LitigationPage() {
  return (
    <>
      <PageHeader
        title="For Litigation"
        description="Case chronology, evidence management, authority research, argument preparation, multi-agent debate, and deadline monitoring."
        breadcrumbs={[
          { label: 'Solutions', href: '/solutions' },
          { label: 'Litigation' },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate">Open {BRAND.name} <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Litigation Workflow">
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: <Clock className="size-5" />, title: 'Case Chronology', desc: 'AI-generated timeline from case documents. Track filings, hearings, decisions, and communications.' },
            { icon: <Scale className="size-5" />, title: 'Evidence Management', desc: 'Structured evidence tracking with source provenance, confidence scoring, and cross-referencing.' },
            { icon: <BookOpen className="size-5" />, title: 'Authority Research', desc: 'Find relevant case law and legislation with semantic search. Verify citations before reliance.' },
            { icon: <Swords className="size-5" />, title: 'Debate Simulation', desc: 'Multi-agent argument simulation. Test propositions against counterarguments with AI adjudication.' },
            { icon: <FileText className="size-5" />, title: 'Drafting', desc: 'AI-assisted Writs, Affidavits, Submissions, and legal opinions with citation validation.' },
            { icon: <Bell className="size-5" />, title: 'Deadline Monitoring', desc: 'Court deadlines, filing dates, and hearing schedules with proactive alerts.' },
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
          <h2 className="text-2xl font-bold text-foreground mb-3">Strengthen your case</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            From chronology to closing argument, AI handles research and drafting while you focus on strategy.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/lawmate/research">Legal Research</Link></Button>
            <Button asChild variant="outline"><Link href="/lawmate/debate">Debate Simulation</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
