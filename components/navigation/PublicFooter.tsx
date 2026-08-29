import Link from 'next/link';
import { Logo } from '@/components/navigation/Logo';
import { BRAND } from '@/lib/brand';

const COLUMNS = [
  {
    heading: 'Platform',
    links: [
      { label: 'Overview', href: '/platform' },
      { label: 'Matter Management', href: '/platform/matter-management' },
      { label: 'Contract Intelligence', href: '/platform/contract-intelligence' },
      { label: 'Legal Research', href: '/platform/legal-research' },
      { label: 'Document Drafting', href: '/platform/document-drafting' },
    ],
  },
  {
    heading: 'Solutions',
    links: [
      { label: 'Law Firms', href: '/solutions/law-firms' },
      { label: 'In-House Legal', href: '/solutions/in-house' },
      { label: 'Litigation', href: '/solutions/litigation' },
      { label: 'Corporate', href: '/solutions/corporate' },
      { label: 'Compliance', href: '/solutions/compliance' },
    ],
  },
  {
    heading: 'AI Agents',
    links: [
      { label: 'All Agents', href: '/agents' },
      { label: 'Retrieval', href: '/agents/retrieval' },
      { label: 'Analysis', href: '/agents/analysis' },
      { label: 'Drafting', href: '/agents/drafting' },
      { label: 'Debate', href: '/agents/debate' },
    ],
  },
  {
    heading: 'Resources',
    links: [
      { label: 'Documentation', href: '/resources/documentation' },
      { label: 'Legal Guides', href: '/resources/legal-guides' },
      { label: 'Case Law', href: '/resources/case-law' },
      { label: 'Changelog', href: '/resources/changelog' },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="border-t border-border/70 bg-card/30 px-4 py-16 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center" aria-label="Lawmate AI home">
              <Logo size="sm" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              AI-native legal operating system for Malaysian law firms.
              Specialised agents, human oversight, built for enterprise.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <nav key={col.heading} aria-label={col.heading}>
              <h3 className="font-heading text-sm font-semibold text-foreground">{col.heading}</h3>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-8 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            © 2026 {BRAND.name}. All rights reserved. AI augments lawyers — it does not replace professional judgment.
          </p>
          <ul className="flex items-center gap-6">
            {[
              { label: 'Privacy', href: '/security/privacy' },
              { label: 'Security', href: '/security' },
              { label: 'Terms', href: '#' },
            ].map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
