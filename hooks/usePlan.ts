'use client';

import type { PlanSlug } from '@/lib/brand';

interface PlanState {
  plan: PlanSlug | undefined;
  subscription: unknown | null;
  credits: unknown | null;
  isLoading: boolean;
  error: unknown | null;
}

export function usePlan(): PlanState {
  return {
    plan: undefined,
    subscription: null,
    credits: null,
    isLoading: false,
    error: null,
  };
}

export function useCreditBalance() {
  return {
    currentBalance: 0,
    totalAllocated: 0,
    totalConsumed: 0,
    usagePercentage: 0,
    isLoading: false,
  };
}
