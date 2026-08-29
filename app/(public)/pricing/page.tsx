import { Metadata } from 'next';
import { BRAND, PLANS } from '@/lib/brand';
import { PageHeader, Section } from '@/components/navigation/PageComponents';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: `Pricing — ${BRAND.name}`,
  description: `${BRAND.description} Every subscription includes AI usage. No separate AI subscription required.`,
};

const PLAN_ORDER = [PLANS.lawyer, PLANS.firm_sme, PLANS.business] as const;

const COMPARISON_CATEGORIES = [
  {
    title: 'AI Workspace',
    features: [
      { name: 'AI Legal Assistant', lawyer: true, firm_sme: true, business: true },
      { name: 'Streaming Responses', lawyer: true, firm_sme: true, business: true },
      { name: 'Conversation History', lawyer: true, firm_sme: true, business: true },
      { name: 'Context Selection', lawyer: true, firm_sme: true, business: true },
    ],
  },
  {
    title: 'Legal Research',
    features: [
      { name: 'Case Law Search', lawyer: true, firm_sme: true, business: true },
      { name: 'Semantic Search', lawyer: true, firm_sme: true, business: true },
      { name: 'Citation Verification', lawyer: true, firm_sme: true, business: true },
      { name: 'IRAC Analysis', lawyer: true, firm_sme: true, business: true },
    ],
  },
  {
    title: 'Contracts & Documents',
    features: [
      { name: 'Contract Review', lawyer: true, firm_sme: true, business: true },
      { name: 'Document Intelligence', lawyer: true, firm_sme: true, business: true },
      { name: 'Document Drafting', lawyer: true, firm_sme: true, business: true },
      { name: 'Template Library', lawyer: false, firm_sme: true, business: true },
    ],
  },
  {
    title: 'Knowledge & Matters',
    features: [
      { name: 'Personal Knowledge Base', lawyer: true, firm_sme: true, business: true },
      { name: 'Matter Management', lawyer: false, firm_sme: true, business: true },
      { name: 'Client Management', lawyer: false, firm_sme: true, business: true },
      { name: 'Shared Knowledge', lawyer: false, firm_sme: true, business: true },
    ],
  },
  {
    title: 'Team & Collaboration',
    features: [
      { name: 'Team Workspaces', lawyer: false, firm_sme: true, business: true },
      { name: 'Collaboration Tools', lawyer: false, firm_sme: true, business: true },
      { name: 'Task Management', lawyer: false, firm_sme: true, business: true },
      { name: 'Approval Workflows', lawyer: false, firm_sme: true, business: true },
    ],
  },
  {
    title: 'AI Agents',
    features: [
      { name: 'Core AI Agents', lawyer: true, firm_sme: true, business: true },
      { name: 'Advanced Agents', lawyer: false, firm_sme: true, business: true },
      { name: 'Custom Agent Builder', lawyer: false, firm_sme: false, business: true },
      { name: 'Workflow Automation', lawyer: false, firm_sme: false, business: true },
    ],
  },
  {
    title: 'Governance & Compliance',
    features: [
      { name: 'HITL Controls', lawyer: true, firm_sme: true, business: true },
      { name: 'Audit Trail', lawyer: true, firm_sme: true, business: true },
      { name: 'Risk Monitoring', lawyer: false, firm_sme: false, business: true },
      { name: 'Regulatory Monitoring', lawyer: false, firm_sme: false, business: true },
      { name: 'Advanced Governance', lawyer: false, firm_sme: false, business: true },
    ],
  },
  {
    title: 'Analytics & API',
    features: [
      { name: 'Usage Dashboard', lawyer: true, firm_sme: true, business: true },
      { name: 'Team Analytics', lawyer: false, firm_sme: true, business: true },
      { name: 'API Access', lawyer: false, firm_sme: false, business: true },
      { name: 'Integrations', lawyer: false, firm_sme: false, business: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <>
      <PageHeader
        title="Pricing"
        description={`${BRAND.tagline} Every subscription includes AI usage. No separate AI subscription required.`}
        breadcrumbs={[{ label: 'Pricing' }]}
      />

      {/* Pricing Cards */}
      <Section>
        <div className="grid gap-6 lg:grid-cols-3">
          {PLAN_ORDER.map((plan) => (
            <div
              key={plan.slug}
              className={`relative rounded-2xl border p-6 ${
                plan.popular
                  ? 'border-primary/50 bg-primary/5 shadow-lg shadow-primary/10'
                  : plan.bestValue
                  ? 'border-[hsl(var(--gold))]/50 bg-[hsl(var(--gold))]/5'
                  : 'border-border/70 bg-card/50'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                    MOST POPULAR
                  </span>
                </div>
              )}
              {plan.bestValue && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="rounded-full bg-[hsl(var(--gold))] px-3 py-1 text-xs font-semibold text-black">
                    BEST VALUE
                  </span>
                </div>
              )}

              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                <p className="text-sm text-muted-foreground">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    RM{plan.monthlyPrice}
                  </span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.monthlyCredits.toLocaleString()} AI Credits included
                </p>
                <p className="text-xs text-muted-foreground">
                  RM{plan.aiUsageValue} indicative AI usage value
                </p>
              </div>

              <Button
                className="w-full mb-6"
                variant={plan.popular ? 'default' : 'outline'}
                asChild
              >
                <Link href="/request-access">
                  Start with {BRAND.name} <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>

              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">
                    {plan.monthlyCredits.toLocaleString()} AI Credits / month
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">
                    RM{plan.aiUsageValue} usage value included
                  </span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">Core AI agents</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">Legal research tools</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                  <span className="text-muted-foreground">HITL controls</span>
                </li>
                {plan.slug !== 'lawyer' && (
                  <li className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                    <span className="text-muted-foreground">Team collaboration</span>
                  </li>
                )}
                {plan.slug === 'business' && (
                  <>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">Advanced governance</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">API access</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          AI usage value represents the indicative value of included AI credits based on {BRAND.name}&apos;s standard credit valuation.
          Credits represent usage capacity and are not redeemable for cash.
        </p>
      </Section>

      {/* Feature Comparison */}
      <Section title="Plan Comparison" description="Compare features across plans">
        <div className="rounded-xl border border-border/70 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">Feature</th>
                  {PLAN_ORDER.map((plan) => (
                    <th key={plan.slug} className="px-4 py-3 text-center text-sm font-semibold text-foreground">
                      {plan.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_CATEGORIES.map((category) => (
                  <>
                    <tr key={category.title} className="bg-muted/30">
                      <td colSpan={4} className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {category.title}
                      </td>
                    </tr>
                    {category.features.map((feature) => (
                      <tr key={feature.name} className="border-b border-border/50">
                        <td className="px-4 py-3 text-sm text-foreground">{feature.name}</td>
                        <td className="px-4 py-3 text-center">
                          {feature.lawyer ? (
                            <Check className="mx-auto size-4 text-emerald-500" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.firm_sme ? (
                            <Check className="mx-auto size-4 text-emerald-500" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {feature.business ? (
                            <Check className="mx-auto size-4 text-emerald-500" />
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

      {/* FAQ / CTA */}
      <Section>
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-3">
            Ready to get started?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
            Start with the plan that fits your practice. Upgrade anytime as your needs grow.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/request-access">Request Access</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contact Sales</Link>
            </Button>
          </div>
        </div>
      </Section>
    </>
  );
}
