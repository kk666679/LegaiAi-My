import { z } from 'zod';
import { router, protectedProcedure, permissionProcedure } from '../trpc';
import { prisma } from '../../db';
import {
  PlanIdSchema, getPlan, getAllPlans, getPlanFeatures,
  formatCredits, formatPrice, getUpgradePath, CREDIT_VALUE_PER_UNIT
} from '../../lib/pricing';
import type { PlanId } from '../../lib/pricing';

const PlanIdEnumSchema = z.enum(['lawyer', 'firm_sme', 'business']);

export const subscriptionRouter = router({

  getPlans: protectedProcedure
    .query(() => {
      const plans = getAllPlans();
      return plans.map((plan) => ({
        ...plan,
        features: getPlanFeatures(plan.planId),
        displayPrice: plan.monthlyPrice,
        formattedPrice: formatPrice(plan.monthlyPrice),
        formattedCredits: formatCredits(plan.monthlyCredits),
        formattedAiValue: formatPrice(plan.aiUsageValue),
      }));
    }),

  getPlanDetails: protectedProcedure
    .input(z.object({ planId: PlanIdEnumSchema }))
    .query(({ input }) => {
      const plan = getPlan(input.planId as PlanId);
      return {
        ...plan,
        features: getPlanFeatures(plan.planId),
        displayPrice: plan.monthlyPrice,
        formattedPrice: formatPrice(plan.monthlyPrice),
        formattedCredits: formatCredits(plan.monthlyCredits),
        formattedAiValue: formatPrice(plan.aiUsageValue),
      };
    }),

  getMySubscription: protectedProcedure
    .query(async ({ ctx }) => {
      const subscription = await prisma.subscription.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!subscription) {
        return null;
      }

      const plan = getPlan(subscription.planId as PlanId);
      const creditAccount = await prisma.creditAccount.findUnique({
        where: { orgId: ctx.orgId! },
      });

      return {
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          trialEndsAt: subscription.trialEndsAt,
          isPromoted: subscription.promotionType !== null,
          promotionalPrice: subscription.promotionalPrice,
        },
        plan: {
          ...plan,
          features: getPlanFeatures(plan.planId),
        },
        credits: creditAccount ? {
          currentBalance: creditAccount.currentBalance,
          totalAllocated: creditAccount.totalAllocated,
          totalConsumed: creditAccount.totalConsumed,
          usagePercentage: plan.monthlyCredits > 0
            ? Math.round((creditAccount.totalConsumed / plan.monthlyCredits) * 100)
            : 0,
          remainingCredits: Math.max(0, plan.monthlyCredits - creditAccount.totalConsumed),
        } : null,
      };
    }),

  getCreditUsage: protectedProcedure
    .query(async ({ ctx }) => {
      const subscription = await prisma.subscription.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!subscription) {
        return null;
      }

      const plan = getPlan(subscription.planId as PlanId);
      const account = await prisma.creditAccount.findUnique({
        where: { orgId: ctx.orgId! },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take: 50,
          },
        },
      });

      if (!account) {
        return null;
      }

      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const recentTransactions = account.transactions.filter(
        (t) => t.createdAt >= thirtyDaysAgo
      );

      return {
        currentBalance: account.currentBalance,
        totalAllocated: account.totalAllocated,
        totalConsumed: account.totalConsumed,
        planCredits: plan.monthlyCredits,
        usagePercentage: plan.monthlyCredits > 0
          ? Math.round((account.totalConsumed / plan.monthlyCredits) * 100)
          : 0,
        remainingCredits: Math.max(0, plan.monthlyCredits - account.totalConsumed),
        formattedBalance: formatCredits(account.currentBalance),
        formattedAllocated: formatCredits(account.totalAllocated),
        formattedConsumed: formatCredits(account.totalConsumed),
        formattedRemaining: formatCredits(Math.max(0, plan.monthlyCredits - account.totalConsumed)),
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          description: t.description,
          createdAt: t.createdAt,
        })),
      };
    }),

  getUsageThresholds: protectedProcedure
    .query(async ({ ctx }) => {
      const account = await prisma.creditAccount.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!account) return null;

      const subscription = await prisma.subscription.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!subscription) return null;

      const plan = getPlan(subscription.planId as PlanId);
      const consumed = account.totalConsumed;
      const total = plan.monthlyCredits;
      const ratio = consumed / total;

      return {
        consumed,
        total,
        percentage: Math.round(ratio * 100),
        thresholds: {
          warning50: ratio >= 0.5,
          warning75: ratio >= 0.75,
          warning90: ratio >= 0.9,
          exhausted: ratio >= 1.0,
        },
        aiUsageValueConsumed: consumed * CREDIT_VALUE_PER_UNIT,
        aiUsageValueRemaining: Math.max(0, (total - consumed) * CREDIT_VALUE_PER_UNIT),
      };
    }),

  subscribe: permissionProcedure('manage_users')
    .input(z.object({
      planId: PlanIdEnumSchema,
      paymentMethodId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const plan = getPlan(input.planId as PlanId);
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1);

      const subscription = await prisma.subscription.upsert({
        where: { orgId: ctx.orgId! },
        create: {
          orgId: ctx.orgId!,
          planId: input.planId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
        update: {
          planId: input.planId,
          status: 'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
        },
      });

      await prisma.creditAccount.upsert({
        where: { orgId: ctx.orgId! },
        create: {
          orgId: ctx.orgId!,
          currentBalance: plan.monthlyCredits,
          totalAllocated: plan.monthlyCredits,
          totalConsumed: 0,
          lastAllocatedAt: now,
          lifetimeAllocated: plan.monthlyCredits,
        },
        update: {
          currentBalance: plan.monthlyCredits,
          totalAllocated: plan.monthlyCredits,
          totalConsumed: 0,
          lastAllocatedAt: now,
          lifetimeAllocated: { increment: plan.monthlyCredits },
        },
      });

      await prisma.creditTransaction.create({
        data: {
          accountId: (await prisma.creditAccount.findUnique({ where: { orgId: ctx.orgId! } }))!.id,
          type: 'ALLOCATION',
          amount: plan.monthlyCredits,
          balanceAfter: plan.monthlyCredits,
          description: `Monthly allocation for ${plan.planName} plan`,
          referenceId: subscription.id,
        },
      });

      return {
        subscriptionId: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        currentPeriodEnd: subscription.currentPeriodEnd,
      };
    }),

  upgrade: permissionProcedure('manage_users')
    .input(z.object({
      toPlanId: PlanIdEnumSchema,
    }))
    .mutation(async ({ input, ctx }) => {
      const currentSub = await prisma.subscription.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!currentSub) {
        throw new Error('No active subscription found');
      }

      const fromPlan = getPlan(currentSub.planId as PlanId);
      const toPlan = getPlan(input.toPlanId as PlanId);

      if (fromPlan.displayOrder >= toPlan.displayOrder) {
        throw new Error('Cannot downgrade through upgrade endpoint');
      }

      const upgrade = getUpgradePath(fromPlan.planId, toPlan.planId);
      if (!upgrade) {
        throw new Error('Invalid upgrade path');
      }

      const now = new Date();
      const subscription = await prisma.subscription.update({
        where: { orgId: ctx.orgId! },
        data: {
          planId: input.toPlanId,
          currentPeriodStart: now,
        },
      });

      const account = await prisma.creditAccount.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (account) {
        const newBalance = account.currentBalance + upgrade.additionalCredits;
        await prisma.creditAccount.update({
          where: { orgId: ctx.orgId! },
          data: {
            currentBalance: newBalance,
            totalAllocated: account.totalAllocated + upgrade.additionalCredits,
            lastAllocatedAt: now,
            lifetimeAllocated: { increment: upgrade.additionalCredits },
          },
        });

        await prisma.creditTransaction.create({
          data: {
            accountId: account.id,
            type: 'ALLOCATION',
            amount: upgrade.additionalCredits,
            balanceAfter: newBalance,
            description: `Upgrade from ${fromPlan.planName} to ${toPlan.planName}`,
            referenceId: subscription.id,
          },
        });
      }

      return {
        subscriptionId: subscription.id,
        previousPlan: fromPlan.planName,
        newPlan: toPlan.planName,
        additionalCredits: upgrade.additionalCredits,
        newBalance: account ? account.currentBalance + upgrade.additionalCredits : 0,
      };
    }),

  cancel: permissionProcedure('manage_users')
    .input(z.object({
      immediate: z.boolean().default(false),
      reason: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const subscription = await prisma.subscription.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!subscription) {
        throw new Error('No subscription found');
      }

      const updated = await prisma.subscription.update({
        where: { orgId: ctx.orgId! },
        data: {
          cancelAtPeriodEnd: !input.immediate,
          status: input.immediate ? 'CANCELLED' : subscription.status,
        },
      });

      return {
        cancelled: true,
        effectiveAt: input.immediate ? new Date() : subscription.currentPeriodEnd,
        willRenew: !input.immediate,
      };
    }),

  reactivate: permissionProcedure('manage_users')
    .mutation(async ({ ctx }) => {
      const subscription = await prisma.subscription.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!subscription) {
        throw new Error('No subscription found');
      }

      const updated = await prisma.subscription.update({
        where: { orgId: ctx.orgId! },
        data: {
          cancelAtPeriodEnd: false,
          status: 'ACTIVE',
        },
      });

      return {
        reactivated: true,
        planId: updated.planId,
      };
    }),

  getUpgradePath: protectedProcedure
    .input(z.object({ toPlanId: PlanIdEnumSchema }))
    .query(async ({ input, ctx }) => {
      const subscription = await prisma.subscription.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!subscription) {
        return null;
      }

      const fromPlan = getPlan(subscription.planId as PlanId);
      const toPlan = getPlan(input.toPlanId as PlanId);
      const upgrade = getUpgradePath(fromPlan.planId, toPlan.planId);

      if (!upgrade || fromPlan.displayOrder >= toPlan.displayOrder) {
        return null;
      }

      return {
        from: {
          planId: fromPlan.planId,
          planName: fromPlan.planName,
          monthlyPrice: fromPlan.monthlyPrice,
          formattedPrice: formatPrice(fromPlan.monthlyPrice),
        },
        to: {
          planId: toPlan.planId,
          planName: toPlan.planName,
          monthlyPrice: toPlan.monthlyPrice,
          formattedPrice: formatPrice(toPlan.monthlyPrice),
        },
        additionalCredits: upgrade.additionalCredits,
        additionalUsers: upgrade.additionalUsers,
        additionalValue: upgrade.additionalValue,
        priceDifference: upgrade.priceDiff,
        formattedPriceDiff: formatPrice(upgrade.priceDiff),
        additionalFeatures: getPlanFeatures(toPlan.planId).filter(
          (f) => !getPlanFeatures(fromPlan.planId).includes(f)
        ),
      };
    }),

  allocateCredits: permissionProcedure('manage_users')
    .input(z.object({
      orgId: z.string(),
      amount: z.number().int().positive(),
      description: z.string(),
      referenceId: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const account = await prisma.creditAccount.findUnique({
        where: { orgId: input.orgId },
      });

      if (!account) {
        throw new Error('Credit account not found');
      }

      const newBalance = account.currentBalance + input.amount;

      await prisma.creditAccount.update({
        where: { orgId: input.orgId },
        data: {
          currentBalance: newBalance,
          totalAllocated: account.totalAllocated + input.amount,
          lastAllocatedAt: new Date(),
          lifetimeAllocated: { increment: input.amount },
        },
      });

      await prisma.creditTransaction.create({
        data: {
          accountId: account.id,
          type: 'ALLOCATION',
          amount: input.amount,
          balanceAfter: newBalance,
          description: input.description,
          referenceId: input.referenceId,
        },
      });

      return {
        newBalance,
        amountAdded: input.amount,
      };
    }),

  consumeCredits: permissionProcedure('run_agents')
    .input(z.object({
      amount: z.number().int().positive(),
      description: z.string(),
      referenceId: z.string().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const account = await prisma.creditAccount.findUnique({
        where: { orgId: ctx.orgId! },
      });

      if (!account) {
        throw new Error('Credit account not found');
      }

      if (account.currentBalance < input.amount) {
        throw new Error(`Insufficient credits. Available: ${account.currentBalance}, Required: ${input.amount}`);
      }

      const newBalance = account.currentBalance - input.amount;

      await prisma.creditAccount.update({
        where: { orgId: ctx.orgId! },
        data: {
          currentBalance: newBalance,
          totalConsumed: account.totalConsumed + input.amount,
          lastConsumedAt: new Date(),
          lifetimeConsumed: { increment: input.amount },
        },
      });

      await prisma.creditTransaction.create({
        data: {
          accountId: account.id,
          type: 'CONSUMPTION',
          amount: -input.amount,
          balanceAfter: newBalance,
          description: input.description,
          referenceId: input.referenceId,
          metadata: input.metadata as any,
        },
      });

      return {
        newBalance,
        amountConsumed: input.amount,
        remaining: newBalance,
      };
    }),
});
