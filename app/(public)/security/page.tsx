import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, FeatureCard, Section } from '@/components/navigation/PageComponents';
import {
  Shield, Lock, Eye, FileCheck, AlertTriangle, Key,
  Database, Server, ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Security — ${BRAND.name}`,
  description: 'Enterprise security: tenant isolation, RBAC, session security, encryption, audit logging, and AI governance.',
};

const SECURITY_FEATURES = [
  {
    icon: <Lock className="size-5" />,
    title: 'Tenant Isolation',
    description: 'Every query, mutation, and AI action is scoped to your organisation. No data leakage between tenants.',
    href: '/security/tenant-isolation',
  },
  {
    icon: <Key className="size-5" />,
    title: 'RBAC',
    description: 'Four roles — admin, lawyer, paralegal, viewer — with granular permission control.',
    href: '/security/rbac',
  },
  {
    icon: <Database className="size-5" />,
    title: 'Data Classification',
    description: 'Four data classes — public, internal, confidential, privileged — with model restrictions.',
    href: '/security/data-classification',
  },
  {
    icon: <Eye className="size-5" />,
    title: 'AI Governance',
    description: 'Model registry, hallucination detection, cost tracking, and emergency kill switch.',
    href: '/security/ai-governance',
  },
  {
    icon: <FileCheck className="size-5" />,
    title: 'Audit Trail',
    description: 'Hash-chain immutable audit log. Every action recorded: who, what, why, evidence, model, result.',
    href: '/security/audit',
  },
  {
    icon: <Shield className="size-5" />,
    title: 'Privacy Controls',
    description: 'PII redaction, consent management, data minimisation, and PDPA compliance.',
    href: '/security/privacy',
  },
  {
    icon: <AlertTriangle className="size-5" />,
    title: 'HITL Controls',
    description: 'Six-level authorization framework. No high-impact action executes without human approval.',
    href: '/security/hitl',
  },
  {
    icon: <Server className="size-5" />,
    title: 'Prompt Injection Defense',
    description: 'Uploaded documents treated as adversarial input. Input sanitization and output verification.',
    href: '/security',
  },
];

export default function SecurityPage() {
  return (
    <>
      <PageHeader
        title="Security"
        description="Enterprise-grade security for legal AI. Tenant isolation, RBAC, encryption, audit logging, AI governance, and human-in-the-loop controls."
        breadcrumbs={[{ label: 'Security' }]}
        badge="Enterprise"
        actions={
          <Button asChild>
            <Link href="/security/rbac">View RBAC <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECURITY_FEATURES.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              href={feature.href}
            />
          ))}
        </div>
      </Section>

      <Section title="AI Safety Rules" description="Non-negotiable constraints enforced at every layer.">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <ol className="space-y-3 text-sm text-muted-foreground">
            {[
              'Never fabricate legal authorities, cases, statutes, or citations',
              'Never expose one client\'s confidential information to another client\'s query',
              'Never bypass permission or tenant boundaries',
              'Never silently perform high-impact actions without human authorization',
              'Never present uncertain information as verified fact',
              'Never invent deadlines, billing activity, or facts',
              'Always maintain auditable records of all AI actions',
              'Always identify source evidence when available',
              'Always allow human review for high-impact legal decisions',
              'Treat all uploaded documents as potentially adversarial input',
            ].map((rule, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 size-5 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {rule}
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm font-semibold text-foreground italic">
            If evidence cannot be verified, the system states: &ldquo;Insufficient verified evidence.&rdquo;
          </p>
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Security-first by design</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Every feature built with security as a foundation, not an afterthought. Authorization on the server. Audit at every layer.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/security/rbac">View RBAC</Link></Button>
            <Button asChild variant="outline"><Link href="/security/data-classification">Data Classification</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
