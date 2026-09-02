import { prisma } from '../../db';
import { paymentOrchestrator } from './orchestrator';
import { getPlan, getAllPlans, type PlanId } from '../pricing';
import { Prisma } from '@prisma/client';

export interface CreateSubscriptionInput {
  organisationId: string;
  userId?: string;
  email: string;
  planId: PlanId;
  countryCode: string;
  currency: string;
  paymentMethod?: string;
  trialPeriodDays?: number;
  promotionId?: string;
}

export interface SubscriptionResult {
  subscriptionId: string;
  provider: string;
  checkoutUrl?: string;
  status: string;
}

export class BillingService {
  async createCheckout(input: CreateSubscriptionInput): Promise<SubscriptionResult> {
    const plan = getPlan(input.planId);
    if (!plan) throw new Error(`Invalid plan: ${input.planId}`);

    const existingCustomer = await prisma.paymentCustomer.findFirst({
      where: { organisationId: input.organisationId },
    });

    let customerId = existingCustomer?.providerCustomerId;
    if (!customerId) {
      const customer = await this.createCustomer({
        email: input.email,
        organisationId: input.organisationId,
        countryCode: input.countryCode,
      });
      customerId = customer.providerCustomerId;
    }

    const successUrl = `${process.env.APP_URL || 'http://localhost:3000'}/legalai/billing/success`;
    const cancelUrl = `${process.env.APP_URL || 'http://localhost:3000'}/legalai/billing`;

    const checkout = await paymentOrchestrator.createCheckout({
      organisationId: input.organisationId,
      userId: input.userId,
      planId: input.planId,
      email: input.email,
      countryCode: input.countryCode,
      currency: input.currency,
      paymentMethod: input.paymentMethod as any,
      successUrl,
      cancelUrl,
    });

    const subscription = await prisma.subscription.create({
      data: {
        orgId: input.organisationId,
        userId: input.userId,
        planId: input.planId,
        provider: checkout.provider,
        currency: input.currency,
        amount: plan.monthlyPrice,
        status: 'PENDING',
        currentPeriodStart: new Date(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        providerSubscriptionId: checkout.sessionId,
        promotionId: input.promotionId,
      },
    });

    await this.createAuditEvent({
      orgId: input.organisationId,
      action: 'subscription.checkout_created',
      subscriptionId: subscription.id,
      metadata: { checkoutUrl: checkout.checkoutUrl, provider: checkout.provider },
    });

    return {
      subscriptionId: subscription.id,
      provider: checkout.provider,
      checkoutUrl: checkout.checkoutUrl,
      status: 'PENDING',
    };
  }

  async activateSubscription(subscriptionId: string, providerPaymentId?: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new Error('Subscription not found');
    if (subscription.status === 'ACTIVE') return;

    const plan = getPlan(subscription.planId as PlanId);
    if (!plan) throw new Error(`Invalid plan: ${subscription.planId}`);

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'ACTIVE',
          providerSubscriptionId: providerPaymentId || subscription.providerSubscriptionId,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.creditAccount.upsert({
        where: { orgId: subscription.orgId },
        create: {
          orgId: subscription.orgId,
          currentBalance: plan.monthlyCredits,
          totalAllocated: plan.monthlyCredits,
          totalConsumed: 0,
          lastAllocatedAt: new Date(),
          lifetimeAllocated: plan.monthlyCredits,
        },
        update: {
          currentBalance: { increment: plan.monthlyCredits },
          totalAllocated: { increment: plan.monthlyCredits },
          lastAllocatedAt: new Date(),
          lifetimeAllocated: { increment: plan.monthlyCredits },
        },
      });

      const account = await tx.creditAccount.findUnique({
        where: { orgId: subscription.orgId },
      });

      if (account) {
        await tx.creditTransaction.create({
          data: {
            accountId: account.id,
            type: 'ALLOCATION',
            amount: plan.monthlyCredits,
            balanceAfter: account.currentBalance + plan.monthlyCredits,
            description: `Monthly allocation for ${plan.planName} plan`,
            referenceId: subscription.id,
          },
        });
      }
    });

    await this.createAuditEvent({
      orgId: subscription.orgId,
      action: 'subscription.activated',
      subscriptionId,
      metadata: { planId: subscription.planId, credits: plan.monthlyCredits },
    });
  }

  async renewSubscription(subscriptionId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new Error('Subscription not found');

    const plan = getPlan(subscription.planId as PlanId);
    if (!plan) throw new Error(`Invalid plan: ${subscription.planId}`);

    const newPeriodStart = new Date(subscription.currentPeriodEnd);
    const newPeriodEnd = new Date(newPeriodStart);
    newPeriodEnd.setMonth(newPeriodEnd.getMonth() + 1);

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          currentPeriodStart: newPeriodStart,
          currentPeriodEnd: newPeriodEnd,
        },
      });

      await tx.creditAccount.update({
        where: { orgId: subscription.orgId },
        data: {
          currentBalance: { increment: plan.monthlyCredits },
          totalAllocated: { increment: plan.monthlyCredits },
          lastAllocatedAt: new Date(),
          lifetimeAllocated: { increment: plan.monthlyCredits },
        },
      });

      const account = await tx.creditAccount.findUnique({
        where: { orgId: subscription.orgId },
      });

      if (account) {
        await tx.creditTransaction.create({
          data: {
            accountId: account.id,
            type: 'ALLOCATION',
            amount: plan.monthlyCredits,
            balanceAfter: account.currentBalance + plan.monthlyCredits,
            description: `Renewal allocation for ${plan.planName} plan`,
            referenceId: subscriptionId,
          },
        });
      }
    });

    await this.createAuditEvent({
      orgId: subscription.orgId,
      action: 'subscription.renewed',
      subscriptionId,
    });
  }

  async upgradeSubscription(subscriptionId: string, newPlanId: PlanId): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new Error('Subscription not found');

    const oldPlan = getPlan(subscription.planId as PlanId);
    const newPlan = getPlan(newPlanId);
    if (!oldPlan || !newPlan) throw new Error('Invalid plan');

    const creditDifference = newPlan.monthlyCredits - oldPlan.monthlyCredits;

    await prisma.$transaction(async (tx) => {
      await tx.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlanId,
          amount: newPlan.monthlyPrice,
        },
      });

      if (creditDifference > 0) {
        await tx.creditAccount.update({
          where: { orgId: subscription.orgId },
          data: {
            currentBalance: { increment: creditDifference },
            totalAllocated: { increment: creditDifference },
            lastAllocatedAt: new Date(),
            lifetimeAllocated: { increment: creditDifference },
          },
        });

        const account = await tx.creditAccount.findUnique({
          where: { orgId: subscription.orgId },
        });

        if (account) {
          await tx.creditTransaction.create({
            data: {
              accountId: account.id,
              type: 'ALLOCATION',
              amount: creditDifference,
              balanceAfter: account.currentBalance + creditDifference,
              description: `Upgrade bonus credits from ${oldPlan.planName} to ${newPlan.planName}`,
              referenceId: subscriptionId,
            },
          });
        }
      }
    });

    await this.createAuditEvent({
      orgId: subscription.orgId,
      action: 'subscription.upgraded',
      subscriptionId,
      metadata: { fromPlan: oldPlan.planName, toPlan: newPlan.planName },
    });
  }

  async cancelSubscription(subscriptionId: string, immediate: boolean = false): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new Error('Subscription not found');

    if (immediate) {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          cancelAtPeriodEnd: true,
        },
      });
    }

    await this.createAuditEvent({
      orgId: subscription.orgId,
      action: immediate ? 'subscription.cancelled_immediate' : 'subscription.cancelled_effective_end',
      subscriptionId,
      metadata: { immediate },
    });
  }

  async handlePaymentSuccess(subscriptionId: string, providerPaymentId: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new Error('Subscription not found');

    await prisma.paymentRecord.create({
      data: {
        organisationId: subscription.orgId,
        subscriptionId,
        provider: subscription.provider,
        providerPaymentId,
        currency: subscription.currency,
        amount: subscription.amount ?? 0,
        status: 'succeeded',
        paidAt: new Date(),
      },
    });

    if (subscription.status === 'PENDING' || subscription.status === 'INCOMPLETE') {
      await this.activateSubscription(subscriptionId, providerPaymentId);
    } else if (subscription.status === 'ACTIVE') {
      await this.renewSubscription(subscriptionId);
    }
  }

  async handlePaymentFailure(subscriptionId: string, error?: string): Promise<void> {
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) throw new Error('Subscription not found');

    const isFirstAttempt = subscription.status === 'PENDING';
    const newStatus = isFirstAttempt ? 'PAYMENT_FAILED' : 'PAST_DUE';

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: newStatus },
    });

    await this.createAuditEvent({
      orgId: subscription.orgId,
      action: 'subscription.payment_failed',
      subscriptionId,
      metadata: { error, attemptNumber: isFirstAttempt ? 1 : 2 },
    });
  }

  async createCustomer(params: {
    email: string;
    name?: string;
    organisationId: string;
    countryCode: string;
  }): Promise<{ id: string; providerCustomerId: string }> {
    const existing = await prisma.paymentCustomer.findFirst({
      where: { organisationId: params.organisationId },
    });

    if (existing) {
      return { id: existing.id, providerCustomerId: existing.providerCustomerId || '' };
    }

    const customer = await prisma.paymentCustomer.create({
      data: {
        email: params.email,
        name: params.name,
        organisationId: params.organisationId,
        countryCode: params.countryCode,
        provider: 'xendit',
        status: 'active',
      },
    });

    return { id: customer.id, providerCustomerId: customer.providerCustomerId || '' };
  }

  async getSubscription(organisationId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { orgId: organisationId },
      orderBy: { createdAt: 'desc' },
    });

    if (!subscription) return null;

    const plan = getPlan(subscription.planId as PlanId);
    const creditAccount = await prisma.creditAccount.findUnique({
      where: { orgId: organisationId },
    });

    return {
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        planName: plan?.planName,
        status: subscription.status,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        amount: subscription.amount,
        currency: subscription.currency,
      },
      plan,
      credits: creditAccount ? {
        currentBalance: creditAccount.currentBalance,
        totalAllocated: creditAccount.totalAllocated,
        totalConsumed: creditAccount.totalConsumed,
        usagePercentage: plan ? Math.round((creditAccount.totalConsumed / plan.monthlyCredits) * 100) : 0,
      } : null,
    };
  }

  private async createAuditEvent(params: {
    orgId: string;
    action: string;
    subscriptionId?: string;
    userId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.paymentAuditLog.create({
      data: {
        orgId: params.orgId,
        userId: params.userId,
        action: params.action,
        subscriptionId: params.subscriptionId,
        metadata: params.metadata as Prisma.InputJsonValue,
      },
    });
  }
}

export const billingService = new BillingService();
