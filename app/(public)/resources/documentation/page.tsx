import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Code, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Documentation — Resources — ${BRAND.name}`,
  description: 'Platform documentation, API reference, and integration guides.',
};

const DOCS = [
  { title: 'Environment Variables', desc: 'All required and optional environment variables for deployment.', category: 'Setup' },
  { title: 'Architecture Overview', desc: 'System architecture: Next.js frontend, Express/tRPC backend, PostgreSQL, Redis, BullMQ.', category: 'Architecture' },
  { title: 'tRPC API Reference', desc: 'All tRPC routers: auth, matters, clients, contracts, agents, debate, governance, hitl.', category: 'API' },
  { title: 'Worker Architecture', desc: 'BullMQ worker setup, queue configuration, and agent execution pipeline.', category: 'Backend' },
  { title: 'Database Schema', desc: 'Prisma schema with 17 models across auth, legal operations, and AI governance.', category: 'Database' },
  { title: 'Deployment Guide', desc: 'Production deployment with Docker Compose, PostgreSQL, Redis, and Ollama.', category: 'Deploy' },
  { title: 'OpenClaw Skills', desc: '30+ legal skill files for the OpenClaw agent framework.', category: 'AI' },
  { title: 'PDPA Compliance', desc: 'PDPA 2025 compliance requirements and implementation.', category: 'Compliance' },
];

export default function DocumentationPage() {
  return (
    <>
      <PageHeader
        title="Documentation"
                description={`Technical documentation for the ${BRAND.name} platform. Architecture, API, deployment, and integration guides.`}
        breadcrumbs={[
          { label: 'Resources', href: '/resources' },
          { label: 'Documentation' },
        ]}
      />

      <Section>
        <div className="grid gap-3 sm:grid-cols-2">
          {DOCS.map((doc) => (
            <div key={doc.title} className="flex items-center justify-between rounded-lg border border-border/70 bg-card/50 p-4 transition-colors hover:bg-card/80">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <h4 className="font-semibold text-foreground text-sm">{doc.title}</h4>
                  <span className="rounded bg-muted/60 px-1.5 py-0.5 text-[10px] text-muted-foreground">{doc.category}</span>
                </div>
                <p className="text-xs text-muted-foreground">{doc.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <div className="rounded-xl border border-border/70 bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Full documentation is available in the project repository.
          </p>
          <div className="flex gap-3 justify-center">
            <Button asChild variant="outline">
              <Link href="https://github.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-4" /> View on GitHub
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/resources">Back to Resources</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
