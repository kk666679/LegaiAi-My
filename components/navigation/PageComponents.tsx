'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  badge?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, breadcrumbs, actions, badge, children }: PageHeaderProps) {
  return (
    <div className="border-b border-border/70 bg-card/20">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-foreground transition-colors">
              <Home className="size-3.5" />
            </Link>
            {breadcrumbs.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5" />
                {item.href ? (
                  <Link href={item.href} className="hover:text-foreground transition-colors">
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-foreground font-medium">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              {badge && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
          {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
        </div>

        {children}
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  href?: string;
  badge?: string;
}

export function FeatureCard({ icon, title, description, href, badge }: FeatureCardProps) {
  const cardContent = (
    <div className={cn(
      'rounded-xl border border-border/70 bg-card/50 p-6 transition-all duration-300',
      href && 'hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5'
    )}>
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {badge && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="group block">
        {cardContent}
      </Link>
    );
  }

  return <div className="group block">{cardContent}</div>;
}

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn('py-12 sm:py-16', className)}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {(title || description) && (
          <div className="mb-8">
            {title && <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>}
            {description && (
              <p className="mt-2 text-muted-foreground max-w-2xl">{description}</p>
            )}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

interface StatsBarProps {
  stats: { label: string; value: string }[];
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="flex flex-wrap gap-6 sm:gap-10">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</p>
          <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
