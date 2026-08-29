'use client';

import type { FeatureName } from '@/lib/entitlements';
import { useFeature } from '@/hooks/useFeature';
import { BRAND } from '@/lib/brand';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface FeatureGateProps {
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showUpgradePrompt = true,
}: FeatureGateProps) {
  const { canAccess, gateMessage } = useFeature(feature);

  if (canAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (showUpgradePrompt) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border/70 bg-muted/30 p-8 text-center">
        <div className="mb-4 rounded-full bg-muted p-3">
          <Lock className="size-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Feature Not Available</h3>
        <p className="mb-6 max-w-sm text-sm text-muted-foreground">
          {gateMessage}
        </p>
        <Button asChild>
          <Link href="/pricing">View {BRAND.name} Plans</Link>
        </Button>
      </div>
    );
  }

  return null;
}
