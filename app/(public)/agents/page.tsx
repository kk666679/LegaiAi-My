import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import {
  Bot, Search, Scale, FileText, CheckCircle2, Shield,
  Network, Eye, Swords, Bell, Database, FlaskConical,
  Code, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: `AI Agents — ${BRAND.name}`,
  description: '12 specialised AI agents handling retrieval, analysis, drafting, validation, debate, monitoring, and more.',
};

const AGENTS = [
  {
    id: 'retrieval',
    icon: <Search className="size-5" />,
    name: 'Legal Retrieval',
    queue: 'legal-retrieval',
    description: 'pgVector semantic search, hybrid retrieval, citation-aware ranking across Malaysian case law.',
    capabilities: ['Semantic search', 'Hybrid retrieval', 'Citation ranking', 'Evidence selection'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal'],
    href: '/agents/retrieval',
  },
  {
    id: 'analysis',
    icon: <Scale className="size-5" />,
    name: 'Legal Analysis',
    queue: 'legal-analysis',
    description: 'IRAC reasoning, LLM cascade, confidence scoring for legal issue analysis.',
    capabilities: ['IRAC reasoning', 'LLM cascade', 'Confidence scoring', 'Authority verification'],
    hitlLevel: 1,
    dataClasses: ['public', 'internal', 'confidential'],
    href: '/agents/analysis',
  },
  {
    id: 'drafting',
    icon: <FileText className="size-5" />,
    name: 'Legal Drafting',
    queue: 'legal-drafting',
    description: 'Document generation — Writ, Affidavit, Submission, Letter, Contract, and more.',
    capabilities: ['Writ generation', 'Affidavit drafting', 'Submission writing', 'Template rendering'],
    hitlLevel: 2,
    dataClasses: ['public', 'internal', 'confidential'],
    href: '/agents/drafting',
  },
  {
    id: 'validation',
    icon: <CheckCircle2 className="size-5" />,
    name: 'Legal Validation',
    queue: 'legal-validation',
    description: 'Citation verification, hallucination detection, and output quality assurance.',
    capabilities: ['Citation check', 'Hallucination detection', 'Cross-reference', 'Quality scoring'],
    hitlLevel: 1,
    dataClasses: ['public', 'internal', 'confidential'],
    href: '/agents/validation',
  },
  {
    id: 'audit',
    icon: <Shield className="size-5" />,
    name: 'Legal Audit',
    queue: 'legal-audit',
    description: 'Hash-chain audit logs, legal hold, PDPA forget-user, and compliance logging.',
    capabilities: ['Audit logging', 'Hash chain', 'Legal hold', 'PDPA compliance'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal', 'confidential', 'privileged'],
    href: '/agents/audit',
  },
  {
    id: 'orchestrator',
    icon: <Network className="size-5" />,
    name: 'Legal Orchestrator',
    queue: 'legal-orchestrator',
    description: 'Workflow DAG — parallel fan-out retrieval → analysis → drafting with coordination.',
    capabilities: ['Workflow DAG', 'Parallel fan-out', 'Agent coordination', 'Result aggregation'],
    hitlLevel: 2,
    dataClasses: ['public', 'internal', 'confidential'],
    href: '/agents/orchestrator',
  },
  {
    id: 'privacy',
    icon: <Eye className="size-5" />,
    name: 'Legal Privacy',
    queue: 'legal-privacy',
    description: 'PII redaction, consent management, data minimisation, and privacy compliance.',
    capabilities: ['PII redaction', 'Consent management', 'Data minimisation', 'Privacy scoring'],
    hitlLevel: 2,
    dataClasses: ['public', 'internal', 'confidential', 'privileged'],
    href: '/agents/privacy',
  },
  {
    id: 'debate',
    icon: <Swords className="size-5" />,
    name: 'Legal Debate',
    queue: 'legal-debate',
    description: 'Multi-agent argument simulation with adjudication and confidence scoring.',
    capabilities: ['Argument generation', 'Counter-argument', 'Adjudication', 'Confidence scoring'],
    hitlLevel: 1,
    dataClasses: ['public', 'internal', 'confidential'],
    href: '/agents/debate',
  },
  {
    id: 'monitoring',
    icon: <Bell className="size-5" />,
    name: 'Legal Monitoring',
    queue: 'legal-monitoring',
    description: 'Regulatory change detection, trend analysis, and alert dispatch.',
    capabilities: ['Change detection', 'Trend analysis', 'Alert dispatch', 'Subscription management'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal'],
    href: '/agents/monitoring',
  },
  {
    id: 'indexing',
    icon: <Database className="size-5" />,
    name: 'Legal Indexing',
    queue: 'legal-indexing',
    description: 'Document ingestion, embedding generation, and index management for pgVector.',
    capabilities: ['Document ingestion', 'Embedding generation', 'Index management', 'Deduplication'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal', 'confidential'],
    href: '/agents/indexing',
  },
  {
    id: 'testing',
    icon: <FlaskConical className="size-5" />,
    name: 'Legal Testing',
    queue: 'legal-testing',
    description: 'Gold eval dataset, adversarial test vectors, and benchmark execution.',
    capabilities: ['Gold evaluation', 'Adversarial testing', 'Benchmarking', 'Regression detection'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal'],
    href: '/agents/testing',
  },
  {
    id: 'ai-developer',
    icon: <Code className="size-5" />,
    name: 'AI Developer',
    queue: '—',
    description: 'Development utility worker for code generation, refactoring, and technical tasks.',
    capabilities: ['Code generation', 'Refactoring', 'Technical analysis', 'Documentation'],
    hitlLevel: 2,
    dataClasses: ['internal'],
    href: '/agents/ai-developer',
  },
];

const HITL_LABELS: Record<number, string> = {
  0: 'Auto',
  1: 'Recommend',
  2: 'Draft',
  3: 'Execute',
  4: 'Controlled',
  5: 'Prohibited',
};

const HITL_COLORS: Record<number, string> = {
  0: 'bg-emerald-500/10 text-emerald-600',
  1: 'bg-blue-500/10 text-blue-600',
  2: 'bg-amber-500/10 text-amber-600',
  3: 'bg-orange-500/10 text-orange-600',
};

export default function AgentsPage() {
  return (
    <>
      <PageHeader
        title="AI Agent Swarm"
        description="12 specialised AI agents, each with defined responsibilities, HITL authorization levels, and audit logging. All under human control."
        breadcrumbs={[{ label: 'AI Agents' }]}
        badge="12 agents"
        actions={
          <Button asChild>
            <Link href="/legalai/hitl">Agent Control Center <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <Link
              key={agent.id}
              href={agent.href}
              className="group block rounded-xl border border-border/70 bg-card/50 p-5 transition-all hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary">{agent.icon}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-foreground text-sm">{agent.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Queue: {agent.queue}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{agent.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {agent.capabilities.map((cap) => (
                  <span key={cap} className="rounded-full bg-muted/60 px-2 py-0.5 text-[10px] text-muted-foreground">
                    {cap}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={`text-[10px] ${HITL_COLORS[agent.hitlLevel]}`}>
                  L{agent.hitlLevel} {HITL_LABELS[agent.hitlLevel]}
                </Badge>
                <div className="flex gap-1 ml-auto">
                  {agent.dataClasses.map((cls) => (
                    <span key={cls} className="rounded bg-muted/40 px-1.5 py-0.5 text-[9px] text-muted-foreground uppercase">
                      {cls}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      <Section title="HITL Authorization Levels" description="Every agent action is classified before execution.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { level: 0, name: 'Read', desc: 'AI retrieves and analyses — auto-approved' },
            { level: 1, name: 'Recommend', desc: 'AI recommends — auto-approved, no execution' },
            { level: 2, name: 'Draft', desc: 'AI creates draft — human must review and approve' },
            { level: 3, name: 'Execute + Approval', desc: 'AI prepares action — explicit human authorization required' },
            { level: 4, name: 'Controlled Auto', desc: 'Pre-approved low-risk workflow — executes automatically' },
            { level: 5, name: 'Prohibited', desc: 'Never autonomous — blocked at registration' },
          ].map((l) => (
            <div key={l.level} className="rounded-lg border border-border/70 bg-card/50 p-4">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className={`text-[10px] ${HITL_COLORS[l.level] || 'bg-muted/50 text-muted-foreground'}`}>
                  L{l.level}
                </Badge>
                <h4 className="font-semibold text-foreground text-sm">{l.name}</h4>
              </div>
              <p className="text-xs text-muted-foreground">{l.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">Agent Control Center</h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Monitor agent actions, approve or reject HITL requests, and maintain full oversight of AI operations.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild><Link href="/legalai/hitl">Open HITL Control</Link></Button>
            <Button asChild variant="outline"><Link href="/legalai/agents/audit">AI Governance</Link></Button>
          </div>
        </div>
      </Section>
    </>
  );
}
