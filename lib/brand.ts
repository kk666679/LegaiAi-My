export const BRAND = {
  name: "LAWMATE",
  shortName: "LawMate",
  tagline: "The Legal AI Operating Platform",
  description:
    "AI that works with your legal team — not just another chatbot.",
  country: "Malaysia",
  website: "https://legai-my.vercel.app/",
  supportEmail: "tuahkm@gmail.com",
  legalName: "Kurnia Kadir",
} as const;

export interface PlanConfig {
  slug: string;
  name: string;
  monthlyPrice: number;
  currency: string;
  monthlyCredits: number;
  aiUsageValue: number;
  description: string;
  popular?: boolean;
  bestValue?: boolean;
}

export const PLANS = {
  lawyer: {
    slug: "lawyer",
    name: "Lawyer",
    monthlyPrice: 89,
    currency: "MYR",
    monthlyCredits: 750,
    aiUsageValue: 30,
    description: "Personal Legal AI",
    popular: false,
    bestValue: false,
  },
  firm_sme: {
    slug: "firm_sme",
    name: "Firm / SME",
    monthlyPrice: 169,
    currency: "MYR",
    monthlyCredits: 3000,
    aiUsageValue: 120,
    description: "Team Legal AI",
    popular: true,
    bestValue: false,
  },
  business: {
    slug: "business",
    name: "Business",
    monthlyPrice: 399,
    currency: "MYR",
    monthlyCredits: 7500,
    aiUsageValue: 300,
    description: "Complete Legal AI Operations",
    popular: false,
    bestValue: true,
  },
} as const satisfies Record<string, PlanConfig>;

export type PlanSlug = 'lawyer' | 'firm_sme' | 'business';

export const CREDIT_CONFIG = {
  valuePerCredit: 0.04,
  warningThreshold: 0.75,
  criticalThreshold: 0.9,
} as const;

export const PLAN_FEATURES = {
  ai_workspace: { basic: true, firm_sme: true, business: true },
  legal_research: { basic: true, firm_sme: true, business: true },
  contract_review: { basic: true, firm_sme: true, business: true },
  document_intelligence: { basic: true, firm_sme: true, business: true },
  document_generation: { basic: true, firm_sme: true, business: true },
  personal_knowledge: { basic: true, firm_sme: true, business: true },
  matter_management: { basic: false, firm_sme: true, business: true },
  client_management: { basic: false, firm_sme: true, business: true },
  team_collaboration: { basic: false, firm_sme: true, business: true },
  shared_knowledge: { basic: false, firm_sme: true, business: true },
  templates: { basic: false, firm_sme: true, business: true },
  advanced_agents: { basic: false, firm_sme: true, business: true },
  advanced_workflows: { basic: false, firm_sme: true, business: true },
  governance: { basic: false, firm_sme: false, business: true },
  advanced_audit: { basic: false, firm_sme: false, business: true },
  risk_monitoring: { basic: false, firm_sme: false, business: true },
  regulatory_monitoring: { basic: false, firm_sme: false, business: true },
  advanced_analytics: { basic: false, firm_sme: false, business: true },
  api_access: { basic: false, firm_sme: false, business: true },
  integrations: { basic: false, firm_sme: false, business: true },
} as const;

export type FeatureName = keyof typeof PLAN_FEATURES;
export type PlanTier = 'basic' | 'firm_sme' | 'business';

export const PLAN_TIER_MAP: Record<PlanSlug, PlanTier> = {
  lawyer: 'basic',
  firm_sme: 'firm_sme',
  business: 'business',
};
