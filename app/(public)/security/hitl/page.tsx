import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Eye, ArrowRight, Shield, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `HITL Controls — Security — ${BRAND.name}`,
  description: 'Human-in-the-loop authorization framework with six levels.',
};

const LEVELS = [
  { level: 0, name: 'Read', desc: 'AI retrieves and analyses — auto-approved', color: 'bg-emerald-500/10 text-emerald-600' },
  { level: 1, name: 'Recommend', desc: 'AI recommends — auto-approved, no execution', color: 'bg-blue-500/10 text-blue-600' },
  { level: 2, name: 'Draft', desc: 'AI creates draft — human must review and approve', color: 'bg-amber-500/10 text-amber-600' },
  { level: 3, name: 'Execute + Approval', desc: 'AI prepares action — explicit human authorization required', color: 'bg-orange-500/10 text-orange-600' },
  { level: 4, name: 'Controlled Auto', desc: 'Pre-approved low-risk workflow — executes automatically', color: 'bg-purple-500/10 text-purple-600' },
  { level: 5, name: 'Prohibited', desc: 'Never autonomous — blocked at registration', color: 'bg-red-500/10 text-red-600' },
];

export default function HITLSecurityPage() {
  return (
    <>
      <PageHeader
        title="Human-in-the-Loop Controls"
        description="Six-level authorization framework. Every agent action is classified before execution. Levels 2+ require explicit human approval."
        breadcrumbs={[
          { label: 'Security', href: '/security' },
          { label: 'HITL Controls' },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate/hitl">Open Control Center <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Authorization Levels">
        <div className="space-y-3">
          {LEVELS.map((l) => (
            <div key={l.level} className="flex items-center gap-4 rounded-lg border border-border/70 bg-card/50 p-4">
              <Badge variant="outline" className={`shrink-0 text-xs ${l.color}`}>
                L{l.level}
              </Badge>
              <div>
                <h4 className="font-semibold text-foreground text-sm">{l.name}</h4>
                <p className="text-xs text-muted-foreground">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Every Action Records">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <p className="text-sm text-muted-foreground mb-4 font-semibold">Who → What → Why → Data Used → AI Model → Tools → Result → Approval → Timestamp</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> No high-impact action executes without human approval</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Authorization is enforced server-side</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Full audit trail for every HITL decision</li>
            <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Reject and request-change workflows available</li>
          </ul>
        </div>
      </Section>
    </>
  );
}
