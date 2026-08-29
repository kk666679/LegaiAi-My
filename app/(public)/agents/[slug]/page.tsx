import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { notFound } from 'next/navigation';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import {
  Search, Scale, FileText, CheckCircle2, Shield, Network,
  Eye, Swords, Bell, Database, FlaskConical, Code,
  ArrowRight, Bot, Clock, Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const AGENT_DATA: Record<string, {
  name: string;
  icon: React.ReactNode;
  description: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  capabilities: string[];
  hitlLevel: number;
  dataClasses: string[];
  workflow: string[];
}> = {
  retrieval: {
    name: 'Legal Retrieval',
    icon: <Search className="size-5" />,
    description: 'pgVector semantic search, hybrid retrieval, and citation-aware ranking across Malaysian case law.',
    purpose: 'Find relevant legal authorities, cases, and legislation for any legal query.',
    inputs: ['Natural language query', 'Jurisdiction filter', 'Court filter', 'Date range', 'Topic tags'],
    outputs: ['Ranked results', 'Citation metadata', 'Confidence scores', 'Source provenance'],
    capabilities: ['Semantic search', 'Hybrid retrieval', 'Citation ranking', 'Evidence selection'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal'],
    workflow: ['Query', 'Hybrid Retrieval', 'Ranking', 'Evidence Selection', 'Citation Provenance', 'Confidence'],
  },
  analysis: {
    name: 'Legal Analysis',
    icon: <Scale className="size-5" />,
    description: 'IRAC reasoning, LLM cascade, and confidence scoring for legal issue analysis.',
    purpose: 'Apply IRAC framework to legal issues with verified evidence.',
    inputs: ['Legal issue', 'Evidence set', 'Jurisdiction', 'Matter context'],
    outputs: ['IRAC analysis', 'Confidence scores', 'Authority references', 'Risk indicators'],
    capabilities: ['IRAC reasoning', 'LLM cascade', 'Confidence scoring', 'Authority verification'],
    hitlLevel: 1,
    dataClasses: ['public', 'internal', 'confidential'],
    workflow: ['Issue Identification', 'Legal Research', 'IRAC Analysis', 'Confidence Scoring', 'Evidence Linking'],
  },
  drafting: {
    name: 'Legal Drafting',
    icon: <FileText className="size-5" />,
    description: 'Document generation — Writ, Affidavit, Submission, Letter, Contract, and more.',
    purpose: 'Generate legally compliant documents with citation validation.',
    inputs: ['Matter context', 'Document type', 'Instructions', 'Evidence set', 'Template'],
    outputs: ['Draft document', 'Citation list', 'Validation report', 'Version history'],
    capabilities: ['Writ generation', 'Affidavit drafting', 'Submission writing', 'Template rendering'],
    hitlLevel: 2,
    dataClasses: ['public', 'internal', 'confidential'],
    workflow: ['Matter Context', 'Document Type', 'Evidence Selection', 'AI Draft', 'Citation Validation', 'Human Review'],
  },
  validation: {
    name: 'Legal Validation',
    icon: <CheckCircle2 className="size-5" />,
    description: 'Citation verification, hallucination detection, and output quality assurance.',
    purpose: 'Verify that AI outputs are grounded in real authorities and evidence.',
    inputs: ['AI output', 'Citation list', 'Evidence set', 'Quality criteria'],
    outputs: ['Validation report', 'Citation status', 'Hallucination flags', 'Quality score'],
    capabilities: ['Citation check', 'Hallucination detection', 'Cross-reference', 'Quality scoring'],
    hitlLevel: 1,
    dataClasses: ['public', 'internal', 'confidential'],
    workflow: ['Input Analysis', 'Citation Verification', 'Hallucination Detection', 'Quality Scoring', 'Report Generation'],
  },
  debate: {
    name: 'Legal Debate',
    icon: <Swords className="size-5" />,
    description: 'Multi-agent argument simulation with adjudication and confidence scoring.',
    purpose: 'Test legal propositions through adversarial argument simulation.',
    inputs: ['Legal proposition', 'Evidence set', 'Jurisdiction', 'Debate parameters'],
    outputs: ['Argument rounds', 'Counter-arguments', 'Adjudication', 'Confidence scores'],
    capabilities: ['Argument generation', 'Counter-argument', 'Adjudication', 'Confidence scoring'],
    hitlLevel: 1,
    dataClasses: ['public', 'internal', 'confidential'],
    workflow: ['Proposition', 'Research', 'Argument', 'Counter-Argument', 'Evidence Validation', 'Adjudication', 'Final Analysis'],
  },
  orchestrator: {
    name: 'Legal Orchestrator',
    icon: <Network className="size-5" />,
    description: 'Workflow DAG — parallel fan-out retrieval to analysis to drafting with coordination.',
    purpose: 'Coordinate multi-agent workflows and aggregate results.',
    inputs: ['Workflow request', 'Agent list', 'Parameters'],
    outputs: ['Coordinated results', 'Execution trace', 'Status'],
    capabilities: ['Workflow DAG', 'Parallel fan-out', 'Agent coordination', 'Result aggregation'],
    hitlLevel: 2,
    dataClasses: ['public', 'internal', 'confidential'],
    workflow: ['Request', 'Plan', 'Fan-out', 'Execute', 'Aggregate', 'Validate', 'Result'],
  },
  audit: {
    name: 'Legal Audit',
    icon: <Shield className="size-5" />,
    description: 'Hash-chain audit logs, legal hold, PDPA forget-user, and compliance logging.',
    purpose: 'Maintain immutable audit records for all system actions.',
    inputs: ['Action event', 'Actor', 'Context'],
    outputs: ['Audit record', 'Hash chain', 'Compliance status'],
    capabilities: ['Audit logging', 'Hash chain', 'Legal hold', 'PDPA compliance'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal', 'confidential', 'privileged'],
    workflow: ['Event', 'Classify', 'Record', 'Hash', 'Store', 'Verify'],
  },
  privacy: {
    name: 'Legal Privacy',
    icon: <Eye className="size-5" />,
    description: 'PII redaction, consent management, data minimisation, and privacy compliance.',
    purpose: 'Protect personal data and enforce privacy policies.',
    inputs: ['Document', 'Data subjects', 'Consent records'],
    outputs: ['Redacted document', 'Privacy score', 'Compliance report'],
    capabilities: ['PII redaction', 'Consent management', 'Data minimisation', 'Privacy scoring'],
    hitlLevel: 2,
    dataClasses: ['public', 'internal', 'confidential', 'privileged'],
    workflow: ['Scan', 'Detect PII', 'Redact', 'Validate', 'Report'],
  },
  monitoring: {
    name: 'Legal Monitoring',
    icon: <Bell className="size-5" />,
    description: 'Regulatory change detection, trend analysis, and alert dispatch.',
    purpose: 'Monitor regulatory landscape and dispatch relevant alerts.',
    inputs: ['Topics', 'Jurisdictions', 'Subscriptions'],
    outputs: ['Change alerts', 'Trend analysis', 'Notifications'],
    capabilities: ['Change detection', 'Trend analysis', 'Alert dispatch', 'Subscription management'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal'],
    workflow: ['Monitor', 'Detect', 'Classify', 'Alert', 'Dispatch'],
  },
  indexing: {
    name: 'Legal Indexing',
    icon: <Database className="size-5" />,
    description: 'Document ingestion, embedding generation, and index management for pgVector.',
    purpose: 'Ingest documents and maintain vector search indices.',
    inputs: ['Documents', 'Metadata', 'Configuration'],
    outputs: ['Embeddings', 'Index status', 'Dedup report'],
    capabilities: ['Document ingestion', 'Embedding generation', 'Index management', 'Deduplication'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal', 'confidential'],
    workflow: ['Ingest', 'Parse', 'Embed', 'Index', 'Verify'],
  },
  testing: {
    name: 'Legal Testing',
    icon: <FlaskConical className="size-5" />,
    description: 'Gold eval dataset, adversarial test vectors, and benchmark execution.',
    purpose: 'Evaluate agent quality and detect regressions.',
    inputs: ['Test dataset', 'Configuration'],
    outputs: ['Eval results', 'Benchmarks', 'Regression report'],
    capabilities: ['Gold evaluation', 'Adversarial testing', 'Benchmarking', 'Regression detection'],
    hitlLevel: 0,
    dataClasses: ['public', 'internal'],
    workflow: ['Load tests', 'Execute', 'Score', 'Report', 'Flag regressions'],
  },
};

const AGENT_SLUGS = Object.keys(AGENT_DATA);

const HITL_LABELS: Record<number, string> = {
  0: 'Auto',
  1: 'Recommend',
  2: 'Draft',
  3: 'Execute',
  4: 'Controlled',
  5: 'Prohibited',
};

export function generateStaticParams() {
  return AGENT_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const agent = AGENT_DATA[slug];
  if (!agent) return { title: 'Agent Not Found' };
  return {
    title: `${agent.name} — AI Agents — ${BRAND.name}`,
    description: agent.description,
  };
}

export default async function AgentDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = AGENT_DATA[slug];

  if (!agent) {
    notFound();
  }

  return (
    <>
      <PageHeader
        title={agent.name}
        description={agent.description}
        breadcrumbs={[
          { label: 'AI Agents', href: '/agents' },
          { label: agent.name },
        ]}
        actions={
          <div className="flex gap-3">
            <Button asChild>
              <Link href="/legalai/hitl">Agent Control Center <ArrowRight className="ml-2 size-4" /></Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/agents">All Agents</Link>
            </Button>
          </div>
        }
      />

      <Section title="Agent Details">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-border/70 bg-card/50 p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <Bot className="size-4 text-primary" /> Purpose
            </h3>
            <p className="text-sm text-muted-foreground">{agent.purpose}</p>

            <h3 className="font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
              <Activity className="size-4 text-primary" /> HITL Level
            </h3>
            <Badge variant="outline" className="text-xs">
              L{agent.hitlLevel} — {HITL_LABELS[agent.hitlLevel]}
            </Badge>

            <h3 className="font-semibold text-foreground mt-6 mb-3 flex items-center gap-2">
              <Shield className="size-4 text-primary" /> Data Classes
            </h3>
            <div className="flex flex-wrap gap-2">
              {agent.dataClasses.map((cls) => (
                <Badge key={cls} variant="secondary" className="text-xs uppercase">
                  {cls}
                </Badge>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-card/50 p-6">
            <h3 className="font-semibold text-foreground mb-3">Inputs</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground mb-6">
              {agent.inputs.map((input) => (
                <li key={input} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-primary/50 shrink-0" />
                  {input}
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-foreground mb-3">Outputs</h3>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {agent.outputs.map((output) => (
                <li key={output} className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500/50 shrink-0" />
                  {output}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Workflow">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <div className="flex flex-wrap items-center gap-3 justify-center">
            {agent.workflow.map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="rounded-lg border border-border/70 bg-card/80 px-4 py-2.5 text-sm font-medium text-foreground">
                  {step}
                </div>
                {i < agent.workflow.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Capabilities">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {agent.capabilities.map((cap) => (
            <div key={cap} className="rounded-lg border border-border/70 bg-card/50 p-4">
              <p className="text-sm font-medium text-foreground">{cap}</p>
            </div>
          ))}
        </div>
      </Section>
    </>
  );
}
