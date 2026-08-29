'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCredits, formatPrice, CREDIT_VALUE_PER_UNIT } from '@/lib/pricing-client';
import { AlertTriangle, Zap, TrendingUp, Clock } from 'lucide-react';

interface CreditUsageDashboardProps {
  currentBalance: number;
  totalAllocated: number;
  totalConsumed: number;
  planCredits: number;
  onNavigateToUpgrade?: () => void;
}

export function CreditUsageDashboard({
  currentBalance,
  totalAllocated,
  totalConsumed,
  planCredits,
  onNavigateToUpgrade,
}: CreditUsageDashboardProps) {
  const usagePercentage = planCredits > 0 ? Math.round((totalConsumed / planCredits) * 100) : 0;
  const remainingCredits = Math.max(0, planCredits - totalConsumed);
  const aiValueConsumed = totalConsumed * CREDIT_VALUE_PER_UNIT;
  const aiValueRemaining = remainingCredits * CREDIT_VALUE_PER_UNIT;

  const getStatusColor = () => {
    if (usagePercentage >= 90) return 'text-red-500';
    if (usagePercentage >= 75) return 'text-orange-500';
    if (usagePercentage >= 50) return 'text-yellow-500';
    return 'text-emerald-500';
  };

  const getProgressColor = () => {
    if (usagePercentage >= 90) return 'bg-red-500';
    if (usagePercentage >= 75) return 'bg-orange-500';
    if (usagePercentage >= 50) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            AI Credit Usage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Available Credits</p>
              <p className="text-3xl font-bold">{formatCredits(currentBalance)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-lg font-semibold">{usagePercentage}% used</p>
            </div>
          </div>

          <div className="space-y-2">
            <Progress value={usagePercentage} className={cn('h-3', usagePercentage >= 90 && 'animate-pulse')} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              <span>{formatCredits(planCredits)} total</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Allocated</p>
              <p className="text-lg font-semibold">{formatCredits(totalAllocated)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Consumed</p>
              <p className={cn('text-lg font-semibold', getStatusColor())}>{formatCredits(totalConsumed)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-lg font-semibold">{formatCredits(remainingCredits)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {usagePercentage >= 75 && (
        <Card className="border-orange-500/50 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-orange-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-sm">Credits Running Low</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You have used {usagePercentage}% of your monthly credits.
                  {remainingCredits > 0
                    ? ` ${formatCredits(remainingCredits)} credits remaining.`
                    : ' Your credits are exhausted.'}
                </p>
                {onNavigateToUpgrade && (
                  <button
                    onClick={onNavigateToUpgrade}
                    className="mt-2 text-xs text-primary hover:underline font-medium"
                  >
                    Upgrade to get more credits →
                  </button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="size-4 text-primary" />
            AI Usage Value
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Value Consumed</p>
              <p className="text-xl font-semibold">{formatPrice(aiValueConsumed)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Value Remaining</p>
              <p className="text-xl font-semibold">{formatPrice(aiValueRemaining)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            1 AI Credit = {formatPrice(CREDIT_VALUE_PER_UNIT)} usage value. Credits are usage units and are not redeemable for cash.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="size-4 text-primary" />
            Usage Thresholds
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { threshold: 50, label: '50% warning', reached: usagePercentage >= 50 },
            { threshold: 75, label: '75% warning', reached: usagePercentage >= 75 },
            { threshold: 90, label: '90% warning', reached: usagePercentage >= 90 },
            { threshold: 100, label: 'Exhausted', reached: usagePercentage >= 100 },
          ].map((item) => (
            <div key={item.threshold} className="flex items-center justify-between">
              <span className="text-sm">{item.label}</span>
              <Badge variant={item.reached ? 'default' : 'secondary'}>
                {item.reached ? 'Reached' : 'Not reached'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
