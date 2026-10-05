"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  badge,
  children,
}: PageHeaderProps) {
  return (
    <div className="border-b border-border/70 bg-card/20">
      <div className="mx-auto max-w-[1400px] px-4 py-12 sm:px-6 sm:py-16 lg:px-10">
        {breadcrumbs?.length ? (
          <nav
            className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link href="/" className="transition-colors hover:text-foreground">
              <Home className="size-3.5" />
            </Link>
            {breadcrumbs.map((item, index) => (
              <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
                <ChevronRight className="size-3.5" />
                {item.href ? (
                  <Link href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-medium text-foreground">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        ) : null}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-2 flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                {title}
              </h1>
              {badge && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {badge}
                </span>
              )}
            </div>
            <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
              {description}
            </p>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
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
  const content = (
    <div
      className={cn(
        "rounded-xl border border-border/70 bg-card/50 p-6 transition-all duration-300",
        href &&
          "hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5",
      )}
    >
      <div className="flex items-start gap-4">
        <div className="shrink-0 rounded-lg bg-primary/10 p-2.5 text-primary">{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <h3 className="font-semibold text-foreground">{title}</h3>
            {badge && (
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                {badge}
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} className="group block">
      {content}
    </Link>
  ) : (
    <div className="group block">{content}</div>
  );
}

interface SectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Section({ title, description, children, className }: SectionProps) {
  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10">
        {(title || description) && (
          <div className="mb-8">
            {title && (
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h2>
            )}
            {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}

export function StatsBar({ stats }: { stats: { label: string; value: string }[] }) {
  return (
    <div className="flex flex-wrap gap-6 sm:gap-10">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
          <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
