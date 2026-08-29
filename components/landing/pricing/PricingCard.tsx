'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Building2, Briefcase } from 'lucide-react';
import { formatCredits, formatPrice } from '@/lib/pricing-client';

interface PricingCardProps {
  planId: string;
  planName: string;
  monthlyPrice: number;
  monthlyCredits: number;
  aiUsageValue: number;
  positioning: string;
  microcopy: string;
  features: string[];
  isPopular?: boolean;
  isBestValue?: boolean;
  onSelect: (planId: string) => void;
  loading?: boolean;
}

export function PricingCard({
  planId,
  planName,
  monthlyPrice,
  monthlyCredits,
  aiUsageValue,
  positioning,
  microcopy,
  features,
  isPopular,
  isBestValue,
  onSelect,
  loading,
}: PricingCardProps) {
  const getIcon = () => {
    switch (planId) {
      case 'lawyer':
        return <Sparkles className="size-5" />;
      case 'firm_sme':
        return <Building2 className="size-5" />;
      case 'business':
        return <Briefcase className="size-5" />;
      default:
        return <Sparkles className="size-5" />;
    }
  };

  return (
    <Card
      className={cn(
        'relative flex flex-col transition-all duration-300',
        isPopular && 'border-primary/50 shadow-lg shadow-primary/10',
        isBestValue && 'border-[hsl(var(--brand-gold))]/50 shadow-lg shadow-[hsl(var(--brand-gold))]/10'
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1 text-xs font-semibold">
            MOST POPULAR
          </Badge>
        </div>
      )}
      {isBestValue && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-[hsl(var(--brand-gold))] text-black px-3 py-1 text-xs font-semibold">
            BEST VALUE
          </Badge>
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          {getIcon()}
          <span className="text-sm font-medium">{planName}</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold">{formatPrice(monthlyPrice)}</span>
          <span className="text-muted-foreground">/month</span>
        </div>
        <CardTitle className="text-base font-normal text-muted-foreground mt-1">
          {positioning}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col">
        <div className="mb-4 space-y-1">
          <p className="text-sm font-semibold text-primary">
            {formatCredits(monthlyCredits)} AI Credits included
          </p>
          <p className="text-xs text-muted-foreground">
            {formatPrice(aiUsageValue)} AI usage value included
          </p>
        </div>

        <p className="text-sm text-muted-foreground mb-4">{microcopy}</p>

        <div className="flex-1">
          <h4 className="text-sm font-semibold mb-2">Features:</h4>
          <ul className="space-y-2">
            {features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="size-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <Button
          className={cn(
            'w-full mt-6',
            isPopular && 'bg-primary hover:bg-primary/90',
            isBestValue && 'bg-[hsl(var(--brand-gold))] hover:bg-[hsl(var(--brand-gold))]/90 text-black'
          )}
          onClick={() => onSelect(planId)}
          disabled={loading}
        >
          {loading ? 'Processing...' : `Start with ${planName}`}
        </Button>
      </CardContent>
    </Card>
  );
}
