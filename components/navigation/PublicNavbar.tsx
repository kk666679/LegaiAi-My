'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, X, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/navigation/Logo';
import { BRAND } from '@/lib/brand';

const NAV_LINKS = [
  {
    label: 'Platform',
    href: '/platform',
    children: [
      { label: 'Overview', href: '/platform' },
      { label: 'Matter Management', href: '/platform/matter-management' },
      { label: 'Contract Intelligence', href: '/platform/contract-intelligence' },
      { label: 'Legal Research', href: '/platform/legal-research' },
      { label: 'Document Drafting', href: '/platform/document-drafting' },
    ],
  },
  {
    label: 'Solutions',
    href: '/solutions',
    children: [
      { label: 'Overview', href: '/solutions' },
      { label: 'Law Firms', href: '/solutions/law-firms' },
      { label: 'In-House Legal', href: '/solutions/in-house' },
      { label: 'Litigation', href: '/solutions/litigation' },
      { label: 'Corporate', href: '/solutions/corporate' },
      { label: 'Compliance', href: '/solutions/compliance' },
    ],
  },
  {
    label: 'AI Agents',
    href: '/agents',
    children: [
      { label: 'All Agents', href: '/agents' },
      { label: 'Retrieval', href: '/agents/retrieval' },
      { label: 'Analysis', href: '/agents/analysis' },
      { label: 'Drafting', href: '/agents/drafting' },
      { label: 'Validation', href: '/agents/validation' },
      { label: 'Debate', href: '/agents/debate' },
      { label: 'Orchestrator', href: '/agents/orchestrator' },
    ],
  },
  {
    label: 'Security',
    href: '/security',
    children: [
      { label: 'Overview', href: '/security' },
      { label: 'RBAC', href: '/security/rbac' },
      { label: 'Data Classification', href: '/security/data-classification' },
      { label: 'AI Governance', href: '/security/ai-governance' },
      { label: 'Audit', href: '/security/audit' },
      { label: 'Privacy', href: '/security/privacy' },
      { label: 'HITL Controls', href: '/security/hitl' },
    ],
  },
  {
    label: 'Resources',
    href: '/resources',
    children: [
      { label: 'Overview', href: '/resources' },
      { label: 'Documentation', href: '/resources/documentation' },
      { label: 'Legal Guides', href: '/resources/legal-guides' },
      { label: 'Case Law', href: '/resources/case-law' },
      { label: 'Changelog', href: '/resources/changelog' },
    ],
  },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/70 bg-background/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent'
      )}
    >
      <nav
        aria-label="Primary"
        className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
      >
        <Link href="/" className="flex items-center" aria-label="Lawmate AI home">
          <Logo size="md" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname.startsWith(link.href);
            return (
              <li
                key={link.label}
                className="relative"
                onMouseEnter={() => setActiveDropdown(link.label)}
                onMouseLeave={() => setActiveDropdown(null)}
              >
                <Link
                  href={link.href}
                  className={cn(
                    'rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {link.label}
                </Link>

                {/* Dropdown */}
                {activeDropdown === link.label && link.children && (
                  <div className="absolute left-0 top-full z-50 mt-1 w-56 rounded-xl border border-border/70 bg-card/95 p-1.5 backdrop-blur-xl shadow-xl">
                    {link.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
                          pathname === child.href
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                        )}
                      >
                        {child.label}
                        {pathname === child.href && (
                          <ChevronRight className="ml-auto size-3.5 opacity-50" />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/legalai"
            className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Sign in
          </Link>
          <Button asChild size="sm" className="rounded-lg px-4">
            <Link href="/legalai">Open {BRAND.name}</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex size-10 items-center justify-center rounded-lg border border-border/70 text-foreground lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'lg:hidden overflow-hidden border-t border-border/70 bg-background/95 backdrop-blur-xl transition-[max-height,opacity] duration-300',
          mobileOpen ? 'max-h-[80vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 py-4 space-y-1">
          {NAV_LINKS.map((group) => (
            <div key={group.label}>
              <Link
                href={group.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-md px-3 py-2.5 text-sm font-semibold text-foreground"
              >
                {group.label}
              </Link>
              <div className="ml-3 space-y-0.5">
                {group.children?.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'block rounded-md px-3 py-2 text-sm transition-colors',
                      pathname === child.href
                        ? 'text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <div className="mt-4 flex flex-col gap-2 border-t border-border/70 pt-4">
            <Link
              href="/legalai"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg border border-border/70 px-4 py-3 text-center text-sm font-semibold text-foreground"
            >
              Sign in
            </Link>
            <Link
              href="/legalai"
              onClick={() => setMobileOpen(false)}
              className="rounded-lg bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
            >
              Open {BRAND.name}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
