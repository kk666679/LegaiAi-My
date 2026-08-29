import { Metadata } from 'next';
import { BRAND } from '@/lib/brand';
import { PageHeader, FeatureCard, Section } from '@/components/navigation/PageComponents';
import {
  BookOpen, FileText, Scale, Shield, Code, Clock,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Resources — ${BRAND.name}`,
  description: 'Documentation, legal guides, case law resources, templates, and changelog.',
};

const RESOURCES = [
  {
    icon: <Code className="size-5" />,
    title: 'Documentation',
    description: 'Platform API docs, integration guides, deployment instructions, and technical references.',
    href: '/resources/documentation',
  },
  {
    icon: <BookOpen className="size-5" />,
    title: 'Legal Guides',
    description: 'Malaysian legal practice guides covering civil litigation, corporate law, and regulatory compliance.',
    href: '/resources/legal-guides',
  },
  {
    icon: <Scale className="size-5" />,
    title: 'Case Law',
    description: 'Curated Malaysian case law resources organized by practice area and court level.',
    href: '/resources/case-law',
  },
  {
    icon: <FileText className="size-5" />,
    title: 'Templates',
    description: 'Legal document templates — Writs, Affidavits, Submissions, and more.',
    href: '/resources/templates',
  },
  {
    icon: <Shield className="size-5" />,
    title: 'Security',
    description: 'Security documentation, compliance guides, and data handling procedures.',
    href: '/security',
  },
  {
    icon: <Clock className="size-5" />,
    title: 'Changelog',
    description: 'Platform updates, new features, and recent improvements.',
    href: '/resources/changelog',
  },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHeader
        title="Resources"
                description={`Documentation, legal guides, case law, templates, and platform updates. Everything you need to get the most from ${BRAND.name}.`}
        breadcrumbs={[{ label: 'Resources' }]}
        actions={
          <Button asChild>
            <Link href="/resources/documentation">Documentation <ArrowRight className="ml-2 size-4" /></Link>
          </Button>
        }
      />

      <Section>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {RESOURCES.map((resource) => (
            <FeatureCard
              key={resource.title}
              icon={resource.icon}
              title={resource.title}
              description={resource.description}
              href={resource.href}
            />
          ))}
        </div>
      </Section>

      <Section title="Quick Links">
        <div className="rounded-xl border border-border/70 bg-card/50 p-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Environment Variables', href: '/resources/documentation' },
              { title: 'Deployment Guide', href: '/resources/documentation' },
              { title: 'tRPC API Reference', href: '/resources/documentation' },
              { title: 'Worker Architecture', href: '/resources/documentation' },
              { title: 'OpenClaw Skills', href: '/resources/documentation' },
              { title: 'PDPA Compliance', href: '/resources/documentation' },
            ].map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="rounded-lg border border-border/50 px-4 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </Section>
    </>
  );
}
