import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { FileCheck, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Audit Trail — Security — ${BRAND.name}`,
  description: 'Hash-chain immutable audit logging with legal hold support.',
};

export default function AuditSecurityPage() {
  return (
    <>
      <PageHeader
        title="Audit Trail"
        description="Hash-chain immutable audit logging. Every action recorded: Who → What → Why → Data Used → AI Model → Tools → Result → Approval → Timestamp."
        breadcrumbs={[
          { label: 'Security', href: '/security' },
          { label: 'Audit' },
        ]}
        actions={
          <Button asChild>
            <Link href="/lawmate/agents/audit">View Audit Trail <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section title="Audit Record Structure">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { field: 'Who', desc: 'User identity, role, session' },
              { field: 'What', desc: 'Action type, resource, operation' },
              { field: 'Why', desc: 'Business context, matter reference' },
              { field: 'Data Used', desc: 'Sources, evidence, documents' },
              { field: 'AI Model', desc: 'Model name, version, parameters' },
              { field: 'Tools', desc: 'Agent tools, procedures invoked' },
              { field: 'Result', desc: 'Outcome, output, status' },
              { field: 'Approval', desc: 'HITL decision, approver, timestamp' },
              { field: 'Timestamp', desc: 'UTC timestamp, hash chain link' },
            ].map((f) => (
              <div key={f.field} className="rounded-lg border border-border/50 p-3">
                <h4 className="font-semibold text-foreground text-sm">{f.field}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Guarantees">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border/70 bg-card/50 p-5">
            <Shield className="size-5 text-primary mb-3" />
            <h4 className="font-semibold text-foreground text-sm mb-1">Immutable</h4>
            <p className="text-xs text-muted-foreground">Hash-chain integrity. Tampering is detectable.</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/50 p-5">
            <FileCheck className="size-5 text-primary mb-3" />
            <h4 className="font-semibold text-foreground text-sm mb-1">Legal Hold</h4>
            <p className="text-xs text-muted-foreground">Support for legal hold and preservation orders.</p>
          </div>
          <div className="rounded-lg border border-border/70 bg-card/50 p-5">
            <Shield className="size-5 text-primary mb-3" />
            <h4 className="font-semibold text-foreground text-sm mb-1">PDPA Compliant</h4>
            <p className="text-xs text-muted-foreground">Forget-user support for PDPA compliance.</p>
          </div>
        </div>
      </Section>
    </>
  );
}
