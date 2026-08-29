export const CREDIT_VALUE_PER_UNIT = 0.04;

export const PlanId = {
  LAWYER: 'lawyer',
  FIRM_SME: 'firm_sme',
  BUSINESS: 'business',
} as const;

export type PlanId = typeof PlanId[keyof typeof PlanId];

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

export const PLANS: PlanPricing[] = [
  {
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
  {
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
  {
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
];

export const PLAN_FEATURES: Record<PlanId, string[]> = {
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

export function getPlan(planId: PlanId): PlanPricing | undefined {
  return PLANS.find((p) => p.planId === planId);
}

export function getAllPlans(): PlanPricing[] {
  return [...PLANS].sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getPlanFeatures(planId: PlanId): string[] {
  return PLAN_FEATURES[planId] || [];
}
