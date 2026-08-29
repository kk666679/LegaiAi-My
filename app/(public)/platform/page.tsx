import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, FeatureCard, Section, StatsBar } from '@/components/navigation/PageComponents';
import {
  Briefcase, FileSignature, BookOpen, FileText, Scale,
  Shield, BarChart3, Bot, Eye, AlertTriangle, Bell, Search,
  ArrowRight, CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Platform — ${BRAND.name}`,
  description: 'AI-native legal operating system for Malaysian law firms. Matter management, contract intelligence, legal research, and AI drafting.',
};

const PLATFORM_FEATURES = [
  {
    icon: <Briefcase className="size-5" />,
    title: 'Matter Management',
    description: 'Full matter lifecycle with risk scores, deadlines, HITL controls, and AI-powered insights across litigation and corporate matters.',
    href: '/platform/matter-management',
  },
  {
    icon: <FileSignature className="size-5" />,
    title: 'Contract Intelligence',
    description: 'Upload, analyze, and redline contracts. Extract key terms, identify risk, detect playbook deviations, and chat with your contracts.',
    href: '/platform/contract-intelligence',
  },
  {
    icon: <BookOpen className="size-5" />,
    title: 'Legal Research',
    description: 'Evidence-first legal research with semantic search, citation verification, and IRAC analysis. Malaysian case law and legislation.',
    href: '/platform/legal-research',
  },
  {
    icon: <FileText className="size-5" />,
    title: 'Document Drafting',
    description: 'AI-assisted drafting for Writs, Affidavits, Submissions, Letters, and more. With citation validation and human review workflow.',
    href: '/platform/document-drafting',
  },
  {
    icon: <Scale className="size-5" />,
    title: 'Evidence Management',
    description: 'Structured evidence tracking with source provenance, confidence scoring, and cross-reference capabilities.',
    href: '/platform/evidence',
  },
  {
    icon: <Bot className="size-5" />,
    title: 'AI Agent Swarm',
    description: '12 specialized AI agents handling retrieval, analysis, drafting, validation, debate, monitoring, and more. All under human control.',
    href: '/agents',
  },
  {
    icon: <Eye className="size-5" />,
    title: 'Human-in-the-Loop',
    description: 'Six-level authorization framework (L0–L5). Every high-impact action requires explicit human approval before execution.',
    href: '/security/hitl',
  },
  {
    icon: <BarChart3 className="size-5" />,
    title: 'Executive Analytics',
    description: 'AI ROI, team utilization, matter cycle times, deadline compliance, and contract risk — all grounded in real data.',
    href: '/legalai/analytics',
  },
  {
    icon: <Shield className="size-5" />,
    title: 'AI Governance',
    description: 'Model registry, data classification enforcement, hallucination detection, kill switch, and comprehensive audit trail.',
    href: '/security/ai-governance',
  },
  {
    icon: <AlertTriangle className="size-5" />,
    title: 'Risk Intelligence',
    description: 'Proactive alerts with evidence-grounded risk scores across matters, contracts, deadlines, citations, and compliance.',
    href: '/legalai/risk',
  },
  {
    icon: <Bell className="size-5" />,
    title: 'Legal Monitoring',
    description: 'Regulatory change detection, case-law developments, and trend analysis with configurable alerts and subscriptions.',
    href: '/legalai/monitor',
  },
  {
    icon: <Search className="size-5" />,
    title: 'Universal Search',
    description: 'Full-text and semantic search across matters, clients, contracts, documents, authorities, and audit events.',
    href: '/legalai/search',
  },
];

export default function PlatformPage() {
  return (
    <>
      <PageHeader
        title="Platform"
        description="An AI-native legal operating system where marketing becomes product, product becomes workspace, and AI augments every legal workflow — with humans in control."
        breadcrumbs={[{ label: 'Platform' }]}
        badge="v1.0"
        actions={
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/legalai">
                Open {BRAND.name} <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        }
      >
        <div className="mt-8">
          <StatsBar
            stats={[
              { value: '12', label: 'AI Agents' },
              { value: '17', label: 'Database Models' },
              { value: '6', label: 'HITL Levels' },
              { value: '4', label: 'Data Classifications' },
            ]}
          />
        </div>
      </PageHeader>

      {/* Core Capabilities */}
      <Section
        title="Core Capabilities"
        description="Everything a modern legal team needs — from matter intake to audit trail, powered by specialised AI agents."
      >
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORM_FEATURES.map((feature) => (
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

      {/* Architecture */}
      <Section title="Architecture" description="Built on proven enterprise infrastructure.">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="font-semibold text-foreground mb-2">Frontend</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Next.js 16 + React 19</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> TanStack Query + tRPC</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Tailwind CSS 4 + Radix UI</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Framer Motion</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">Backend</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Express 5 + tRPC 11</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Prisma 7 + PostgreSQL</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> pgVector (1536-dim)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Redis + BullMQ</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">AI / Security</h3>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Ollama (llama3.1 + mxbai)</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> 12 BullMQ workers</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> RBAC + session auth</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-emerald-500" /> Hash-chain audit log</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 sm:p-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
            Ready to transform your legal practice?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            Start with matter management, legal research, or contract analysis. Every workflow connects through one coherent platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/legalai">Open {BRAND.name} Workspace</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/pricing">View Pricing</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
