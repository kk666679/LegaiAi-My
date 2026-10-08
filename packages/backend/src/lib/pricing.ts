export const PlanId = {
  LAWYER: 'lawyer',
  FIRM_SME: 'firm_sme',
  BUSINESS: 'business',
} as const;

export type PlanId = typeof PlanId[keyof typeof PlanId];

import { z } from 'zod';
export const PlanIdSchema = z.enum(['lawyer', 'firm_sme', 'business']);

export const CREDIT_VALUE_PER_UNIT = 0.04;

export interface PlanPricing {
  planId: PlanId;
  planName: string;
  monthlyPrice: number;
  monthlyCredits: number;
  aiUsageValue: number;
  maxUsers: number;
  displayOrder: number;
  positioning: string;
  microcopy: string;
  isPopular?: boolean;
  isBestValue?: boolean;
}

export interface PromotionConfig {
  type: 'founding' | 'seasonal' | 'launch' | null;
  promotionalPrice: number | null;
  startDate: Date | null;
  endDate: Date | null;
}

export interface PlanConfig extends PlanPricing {
  promotion?: PromotionConfig;
  features: string[];
}

const PLANS: Record<PlanId, PlanPricing> = {
  [PlanId.LAWYER]: {
    planId: PlanId.LAWYER,
    planName: 'Lawyer',
    monthlyPrice: 89,
    monthlyCredits: 750,
    aiUsageValue: 30,
    maxUsers: 1,
    displayOrder: 1,
    positioning: 'Personal Legal AI',
    microcopy: 'Start working smarter with personal Legal AI.',
  },
  [PlanId.FIRM_SME]: {
    planId: PlanId.FIRM_SME,
    planName: 'Firm / SME',
    monthlyPrice: 169,
    monthlyCredits: 3000,
    aiUsageValue: 120,
    maxUsers: 5,
    displayOrder: 2,
    positioning: 'Team Legal AI',
    microcopy: 'Give your entire team a shared Legal AI workspace.',
    isPopular: true,
  },
  [PlanId.BUSINESS]: {
    planId: PlanId.BUSINESS,
    planName: 'Business',
    monthlyPrice: 399,
    monthlyCredits: 7500,
    aiUsageValue: 300,
    maxUsers: 15,
    displayOrder: 3,
    positioning: 'Complete Legal AI Operations',
    microcopy: 'Bring AI-powered legal operations across your organisation.',
    isBestValue: true,
  },
};

export function getPlan(planId: PlanId): PlanPricing {
  return PLANS[planId];
}

export function getAllPlans(): PlanPricing[] {
  return Object.values(PLANS).sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getPlanFeatures(planId: PlanId): string[] {
  const baseFeatures: Record<PlanId, string[]> = {
    [PlanId.LAWYER]: [
      'AI Legal Agents',
      'Legal Research',
      'Contract Review',
      'Document Generation',
      'Document Intelligence',
      'Legal Summarisation',
      'Matter / Client Workspace',
      'Personal Knowledge Base',
      'AI-powered document analysis',
      'Basic workflow automation',
      'Secure document workspace',
    ],
    [PlanId.FIRM_SME]: [
      'Everything in Lawyer',
      'Up to 5 users',
      'Shared Firm Knowledge Base',
      'Team AI Workspace',
      'Client / Matter Collaboration',
      'Advanced Workflows',
      'Shared AI Agents',
      'Internal Knowledge Search',
      'Role-Based Permissions',
      'Activity & Audit Logs',
      'Team Analytics',
      'Centralised Templates',
      'Firm-wide AI Instructions',
      'Priority Support',
    ],
    [PlanId.BUSINESS]: [
      'Everything in Firm / SME',
      'Up to 15 users',
      'Advanced AI Agents',
      'Advanced Legal Workflows',
      'Organisation Knowledge Base',
      'Advanced Permissions',
      'Department / Team Workspaces',
      'Advanced Analytics',
      'AI Usage Monitoring',
      'Governance Controls',
      'Advanced Audit Trails',
      'API / Integrations',
      'Workflow Automation',
      'Organisation-wide Templates',
      'Centralised AI Policies',
      'Priority Support',
    ],
  };
  return baseFeatures[planId];
}

export function calculateCreditValue(credits: number): number {
  return credits * CREDIT_VALUE_PER_UNIT;
}

export function isPromotionActive(planId: PlanId): boolean {
  return false;
}

export function getEffectivePrice(planId: PlanId): number {
  const plan = PLANS[planId];
  if (isPromotionActive(planId)) {
    return plan.monthlyPrice;
  }
  return plan.monthlyPrice;
}

export function getDisplayPrice(planId: PlanId): { current: number; original: number | null; isPromoted: boolean } {
  const plan = PLANS[planId];
  const isPromoted = isPromotionActive(planId);
  return {
    current: isPromoted ? plan.monthlyPrice : plan.monthlyPrice,
    original: isPromoted ? plan.monthlyPrice : null,
    isPromoted,
  };
}

export const USAGE_THRESHOLDS = {
  WARNING_50: 0.5,
  WARNING_75: 0.75,
  WARNING_90: 0.9,
  EXHAUSTED: 1.0,
} as const;

export type UsageThreshold = keyof typeof USAGE_THRESHOLDS;

export function getUsageThreshold(consumed: number, total: number): UsageThreshold | null {
  const ratio = consumed / total;
  if (ratio >= USAGE_THRESHOLDS.EXHAUSTED) return 'EXHAUSTED';
  if (ratio >= USAGE_THRESHOLDS.WARNING_90) return 'WARNING_90';
  if (ratio >= USAGE_THRESHOLDS.WARNING_75) return 'WARNING_75';
  if (ratio >= USAGE_THRESHOLDS.WARNING_50) return 'WARNING_50';
  return null;
}

export function formatCredits(credits: number): string {
  return credits.toLocaleString('en-MY');
}

export function formatPrice(amount: number, currency: string = 'MYR'): string {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getUpgradePath(fromPlanId: PlanId, toPlanId: PlanId): { additionalCredits: number; additionalUsers: number; additionalValue: number; priceDiff: number } | null {
  const from = PLANS[fromPlanId];
  const to = PLANS[toPlanId];

  if (from.displayOrder >= to.displayOrder) return null;

  return {
    additionalCredits: to.monthlyCredits - from.monthlyCredits,
    additionalUsers: to.maxUsers - from.maxUsers,
    additionalValue: to.aiUsageValue - from.aiUsageValue,
    priceDiff: to.monthlyPrice - from.monthlyPrice,
  };
}
