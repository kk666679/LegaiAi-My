'use client';

import { useState } from 'react';
import { PricingCard } from './PricingCard';
import { getAllPlans, getPlanFeatures, type PlanId } from '@/lib/pricing-client';
import { Bot, FileSearch, FileText, Shield, BarChart3, Zap } from 'lucide-react';

interface PricingSectionProps {
  onSelectPlan: (planId: string) => void;
  loading?: boolean;
}

export function PricingSection({ onSelectPlan, loading }: PricingSectionProps) {
  const plans = getAllPlans();

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-muted/50 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Every Law Mate subscription includes AI usage. No separate AI subscription required.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <PricingCard
              key={plan.planId}
              planId={plan.planId}
              planName={plan.planName}
              monthlyPrice={plan.monthlyPrice}
              monthlyCredits={plan.monthlyCredits}
              aiUsageValue={plan.aiUsageValue}
              positioning={plan.positioning}
              microcopy={plan.microcopy}
              features={getPlanFeatures(plan.planId as PlanId)}
              isPopular={plan.isPopular}
              isBestValue={plan.isBestValue}
              onSelect={onSelectPlan}
              loading={loading}
            />
          ))}
        </div>

        <div className="mt-16">
          <h3 className="text-center text-lg font-semibold mb-6">
            What can you do with AI Credits?
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 max-w-4xl mx-auto">
            {[
              { icon: <FileSearch className="size-5" />, label: 'Legal Research' },
              { icon: <FileText className="size-5" />, label: 'Contract Review' },
              { icon: <Bot className="size-5" />, label: 'AI Agents' },
              { icon: <Shield className="size-5" />, label: 'Risk Analysis' },
              { icon: <Zap className="size-5" />, label: 'Document Drafting' },
              { icon: <BarChart3 className="size-5" />, label: 'Analytics' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 p-4 rounded-lg bg-muted/50 text-center"
              >
                <div className="text-primary">{item.icon}</div>
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            Different AI actions consume different amounts of credits depending on complexity, model usage and processing requirements.
          </p>
        </div>
      </div>
    </section>
  );
}
