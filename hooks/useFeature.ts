'use client';

import { usePlan } from '@/hooks/usePlan';
import { hasFeature, canAccessFeature, getFeatureGateMessage } from '@/lib/entitlements';
import type { PlanSlug, FeatureName } from '@/lib/brand';

export function useFeature(feature: FeatureName): {
  enabled: boolean;
  canAccess: boolean;
  gateMessage: string | null;
} {
  const { plan, isLoading } = usePlan();

  if (isLoading || !plan) {
    return {
      enabled: false,
      canAccess: false,
      gateMessage: null,
    };
  }

  const enabled = hasFeature(plan as PlanSlug, feature);
  const canAccess = canAccessFeature(plan as PlanSlug, feature);

  return {
    enabled,
    canAccess,
    gateMessage: canAccess ? null : getFeatureGateMessage(feature),
  };
}

export function useFeatures(features: FeatureName[]): Record<FeatureName, boolean> {
  const { plan, isLoading } = usePlan();

  if (isLoading || !plan) {
    return Object.fromEntries(features.map((f) => [f, false])) as Record<FeatureName, boolean>;
  }

  return Object.fromEntries(
    features.map((feature) => [feature, hasFeature(plan as PlanSlug, feature)])
  ) as Record<FeatureName, boolean>;
}
