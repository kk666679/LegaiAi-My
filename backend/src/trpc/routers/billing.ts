import { z } from 'zod';
import { router, protectedProcedure, permissionProcedure } from '../trpc';
import { billingService } from '../../lib/payments/billingService';
import { paymentOrchestrator } from '../../lib/payments/orchestrator';
import { prisma } from '../../db';
import { getAllPlans, getPlan, type PlanId } from '../../lib/pricing';
import { formatCredits, formatPrice } from '../../lib/pricing';

const PlanIdSchema = z.enum(['lawyer', 'firm_sme', 'business']);

export const billingRouter = router({

  getPlans: protectedProcedure
    .query(() => {
      const plans = getAllPlans();
      return plans.map((plan) => ({
        ...plan,
        features: [], // Features are handled separately on frontend
        displayPrice: plan.monthlyPrice,
        formattedPrice: formatPrice(plan.monthlyPrice),
        formattedCredits: formatCredits(plan.monthlyCredits),
        formattedAiValue: formatPrice(plan.aiUsageValue),
      }));
    }),

  getPlanDetails: protectedProcedure
    .input(z.object({ planId: PlanIdSchema }))
    .query(({ input }) => {
      const plan = getPlan(input.planId as PlanId);
      if (!plan) throw new Error('Plan not found');
      return {
        ...plan,
        displayPrice: plan.monthlyPrice,
        formattedPrice: formatPrice(plan.monthlyPrice),
        formattedCredits: formatCredits(plan.monthlyCredits),
        formattedAiValue: formatPrice(plan.aiUsageValue),
      };
    }),

  createCheckout: protectedProcedure
    .input(z.object({
      planId: PlanIdSchema,
      countryCode: z.string().min(2).max(2).default('MY'),
      currency: z.string().min(3).max(3).default('MYR'),
      paymentMethod: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const result = await billingService.createCheckout({
        organisationId: ctx.orgId!,
        userId: ctx.userId,
        email: ctx.user?.email || '',
        planId: input.planId as PlanId,
        countryCode: input.countryCode,
        currency: input.currency,
        paymentMethod: input.paymentMethod,
      });

      return result;
    }),

  getCheckoutUrl: protectedProcedure
    .input(z.object({
      planId: PlanIdSchema,
      countryCode: z.string().min(2).max(2).default('MY'),
    }))
    .mutation(async ({ input, ctx }) => {
      const countryConfig = paymentOrchestrator.getCountryConfig(input.countryCode);
      const currency = countryConfig?.currency || 'MYR';

      const result = await paymentOrchestrator.createCheckout({
        organisationId: ctx.orgId!,
        userId: ctx.userId,
        planId: input.planId as PlanId,
        email: ctx.user?.email || '',
        countryCode: input.countryCode,
        currency,
        successUrl: `${process.env.APP_URL || 'http://localhost:3000'}/legalai/billing/success`,
        cancelUrl: `${process.env.APP_URL || 'http://localhost:3000'}/legalai/billing`,
      });

      return result;
    }),

  getMySubscription: protectedProcedure
    .query(async ({ ctx }) => {
      return billingService.getSubscription(ctx.orgId!);
    }),

  getCreditUsage: protectedProcedure
    .query(async ({ ctx }) => {
      const account = await prisma.creditAccount.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!account) return null;

      const subscription = await prisma.subscription.findFirst({
        where: { orgId: ctx.orgId! },
        orderBy: { createdAt: 'desc' },
      });

      const plan = subscription ? getPlan(subscription.planId as PlanId) : null;

      return {
        currentBalance: account.currentBalance,
        totalAllocated: account.totalAllocated,
        totalConsumed: account.totalConsumed,
        planCredits: plan?.monthlyCredits || 0,
        usagePercentage: plan ? Math.round((account.totalConsumed / plan.monthlyCredits) * 100) : 0,
        remainingCredits: plan ? Math.max(0, plan.monthlyCredits - account.totalConsumed) : 0,
        formattedBalance: formatCredits(account.currentBalance),
        formattedAllocated: formatCredits(account.totalAllocated),
        formattedConsumed: formatCredits(account.totalConsumed),
        formattedRemaining: formatCredits(plan ? Math.max(0, plan.monthlyCredits - account.totalConsumed) : 0),
        recentTransactions: [] as Array<{
          id: string;
          type: string;
          amount: number;
          balanceAfter: number;
          description: string | null;
          createdAt: Date;
        }>,
      };
    }),

  upgrade: permissionProcedure('manage_users')
    .input(z.object({ toPlanId: PlanIdSchema }))
    .mutation(async ({ input, ctx }) => {
      const subscription = await prisma.subscription.findFirst({
        where: { orgId: ctx.orgId! },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) throw new Error('No subscription found');

      await billingService.upgradeSubscription(subscription.id, input.toPlanId as PlanId);

      return { success: true, newPlanId: input.toPlanId };
    }),

  cancel: permissionProcedure('manage_users')
    .input(z.object({
      immediate: z.boolean().default(false),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const subscription = await prisma.subscription.findFirst({
        where: { orgId: ctx.orgId! },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) throw new Error('No subscription found');

      await billingService.cancelSubscription(subscription.id, input.immediate);

      return {
        cancelled: true,
        effectiveAt: input.immediate ? new Date() : subscription.currentPeriodEnd,
      };
    }),

  reactivate: permissionProcedure('manage_users')
    .mutation(async ({ ctx }) => {
      const subscription = await prisma.subscription.findFirst({
        where: { orgId: ctx.orgId! },
        orderBy: { createdAt: 'desc' },
      });

      if (!subscription) throw new Error('No subscription found');

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'ACTIVE',
          cancelAtPeriodEnd: false,
        },
      });

      return { reactivated: true };
    }),

  getPaymentHistory: protectedProcedure
    .input(z.object({
      limit: z.number().default(20),
      cursor: z.string().optional(),
    }))
    .query(async ({ input, ctx }) => {
      const payments = await prisma.paymentRecord.findMany({
        where: { organisationId: ctx.orgId! },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
      });

      let nextCursor: string | undefined;
      if (payments.length > input.limit) {
        nextCursor = payments.pop()?.id;
      }

      return {
        payments: payments.map((p) => ({
          id: p.id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          paymentMethod: p.paymentMethod,
          paidAt: p.paidAt,
          createdAt: p.createdAt,
        })),
        nextCursor,
      };
    }),

  getInvoices: protectedProcedure
    .query(async ({ ctx }) => {
      const invoices = await prisma.invoice.findMany({
        where: { organisationId: ctx.orgId! },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });

      return invoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        total: inv.total,
        currency: inv.currency,
        status: inv.status,
        billingPeriodStart: inv.billingPeriodStart,
        billingPeriodEnd: inv.billingPeriodEnd,
        paidAt: inv.paidAt,
        items: inv.items,
      }));
    }),

  getAvailableCountries: protectedProcedure
    .query(() => {
      const countries = [
        { code: 'MY', name: 'Malaysia', currency: 'MYR' },
        { code: 'ID', name: 'Indonesia', currency: 'IDR' },
        { code: 'SG', name: 'Singapore', currency: 'SGD' },
        { code: 'TH', name: 'Thailand', currency: 'THB' },
        { code: 'PH', name: 'Philippines', currency: 'PHP' },
        { code: 'VN', name: 'Vietnam', currency: 'VND' },
      ];
      return countries;
    }),

  getProviderStatus: protectedProcedure
    .query(async () => {
      const health = await paymentOrchestrator.healthCheckAll();
      const result: Record<string, { healthy: boolean; lastCheck: Date }> = {};
      
      health.forEach((healthy, provider) => {
        result[provider] = { healthy, lastCheck: new Date() };
      });

      return result;
    }),
});
