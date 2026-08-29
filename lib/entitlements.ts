import { PLANS, PLAN_FEATURES, PLAN_TIER_MAP, type PlanSlug, type PlanTier } from './brand';
import type { FeatureName } from './brand';

export type { FeatureName };

export function hasFeature(planSlug: PlanSlug, feature: FeatureName): boolean {
  const tier = PLAN_TIER_MAP[planSlug];
  return PLAN_FEATURES[feature]?.[tier] ?? false;
}

export function getPlanFeatures(planSlug: PlanSlug): FeatureName[] {
  return (Object.keys(PLAN_FEATURES) as FeatureName[]).filter(
    (feature) => hasFeature(planSlug, feature)
  );
}

export function canAccessFeature(
  planSlug: PlanSlug | undefined,
  feature: FeatureName
): boolean {
  if (!planSlug) return false;
  return hasFeature(planSlug, feature);
}

export function getFeatureGateMessage(feature: FeatureName): string {
  const featureLabels: Record<FeatureName, string> = {
    ai_workspace: 'AI Workspace',
    legal_research: 'Legal Research',
    contract_review: 'Contract Review',
    document_intelligence: 'Document Intelligence',
    document_generation: 'Document Generation',
    personal_knowledge: 'Personal Knowledge Base',
    matter_management: 'Matter Management',
    client_management: 'Client Management',
    team_collaboration: 'Team Collaboration',
    shared_knowledge: 'Shared Knowledge Base',
    templates: 'Template Library',
    advanced_agents: 'Advanced AI Agents',
    advanced_workflows: 'Advanced Workflows',
    governance: 'Governance Controls',
    advanced_audit: 'Advanced Audit Trails',
    risk_monitoring: 'Risk Monitoring',
    regulatory_monitoring: 'Regulatory Monitoring',
    advanced_analytics: 'Advanced Analytics',
    api_access: 'API Access',
    integrations: 'Integrations',
  };

  return `Upgrade to Business plan to access ${featureLabels[feature]}`;
}
