'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditUsageDashboard } from '@/components/dashboard/CreditUsageDashboard';
import { formatCredits, formatPrice } from '@/lib/pricing-client';
import { Activity, Bot, CreditCard, Plus, Settings, TrendingUp, ArrowUpRight } from 'lucide-react';

const MOCK_SUBSCRIPTION = {
  planId: 'firm_sme',
  planName: 'Firm / SME',
  status: 'ACTIVE',
  currentPeriodEnd: '2026-09-28',
};

const MOCK_CREDIT_DATA = {
  currentBalance: 2150,
  totalAllocated: 3000,
  totalConsumed: 850,
  planCredits: 3000,
};

export default function BillingPage() {
  const [subscription] = useState(MOCK_SUBSCRIPTION);
  const [credits] = useState(MOCK_CREDIT_DATA);

  return (
    <div className="p-4 lg:p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="size-6 text-primary" />
            Billing & Subscription
          </h1>
          <p className="text-sm text-muted-foreground">Manage your subscription and AI credits</p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/legalai/settings/subscription">
            <Settings className="size-4" />
            Manage Subscription
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CreditUsageDashboard
            currentBalance={credits.currentBalance}
            totalAllocated={credits.totalAllocated}
            totalConsumed={credits.totalConsumed}
            planCredits={credits.planCredits}
            onNavigateToUpgrade={() => {}}
          />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="size-4 text-primary" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{subscription.planName}</h3>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {subscription.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Renews {subscription.currentPeriodEnd}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Price</span>
                  <span className="font-medium">
                    {subscription.planId === 'lawyer' && 'RM89/month'}
                    {subscription.planId === 'firm_sme' && 'RM169/month'}
                    {subscription.planId === 'business' && 'RM399/month'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">AI Credits</span>
                  <span className="font-medium">
                    {subscription.planId === 'lawyer' && '750'}
                    {subscription.planId === 'firm_sme' && '3,000'}
                    {subscription.planId === 'business' && '7,500'}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full gap-2">
                <ArrowUpRight className="size-4" />
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="size-4" />
                Purchase Additional Credits
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Bot className="size-4" />
                View Usage History
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <TrendingUp className="size-4" />
                Download Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
