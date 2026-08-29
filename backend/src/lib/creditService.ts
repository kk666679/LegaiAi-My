import { Prisma } from '@prisma/client';
import { prisma } from '../db';
import { PlanId, getPlan, CREDIT_VALUE_PER_UNIT } from './pricing';
import type { ProviderType } from './providers/types';

export interface CreditConsumptionParams {
  orgId: string;
  userId?: string;
  action: string;
  description: string;
  credits: number;
  referenceId?: string;
  metadata?: Record<string, unknown>;
}

export interface CreditCheckResult {
  allowed: boolean;
  currentBalance: number;
  required: number;
  remainingAfter?: number;
}

const CREDIT_COSTS: Record<string, number> = {
  'legal.research': 5,
  'legal.analysis': 10,
  'legal.drafting': 15,
  'legal.validation': 5,
  'legal.retrieval': 3,
  'document.ocr': 8,
  'document.extraction': 10,
  'document.comparison': 12,
  'embedding.create': 2,
  'ai.chat': 5,
  'ai.stream': 3,
  'agent.run': 20,
};

export function getCreditCost(action: string): number {
  return CREDIT_COSTS[action] || 5;
}

export async function checkCredits(orgId: string, required: number): Promise<CreditCheckResult> {
  const account = await prisma.creditAccount.findUnique({
    where: { orgId },
  });

  if (!account) {
    return {
      allowed: false,
      currentBalance: 0,
      required,
    };
  }

  return {
    allowed: account.currentBalance >= required,
    currentBalance: account.currentBalance,
    required,
    remainingAfter: account.currentBalance - required,
  };
}

export async function consumeCredits(params: CreditConsumptionParams): Promise<{ success: boolean; newBalance: number; error?: string }> {
  const account = await prisma.creditAccount.findUnique({
    where: { orgId: params.orgId },
  });

  if (!account) {
    return { success: false, newBalance: 0, error: 'Credit account not found' };
  }

  if (account.currentBalance < params.credits) {
    return {
      success: false,
      newBalance: account.currentBalance,
      error: `Insufficient credits. Available: ${account.currentBalance}, Required: ${params.credits}`,
    };
  }

  const newBalance = account.currentBalance - params.credits;

  await prisma.creditAccount.update({
    where: { orgId: params.orgId },
    data: {
      currentBalance: newBalance,
      totalConsumed: account.totalConsumed + params.credits,
      lastConsumedAt: new Date(),
      lifetimeConsumed: { increment: params.credits },
    },
  });

  await prisma.creditTransaction.create({
    data: {
      accountId: account.id,
      type: 'CONSUMPTION',
      amount: -params.credits,
      balanceAfter: newBalance,
      description: params.description,
      referenceId: params.referenceId,
      metadata: params.metadata as Prisma.InputJsonValue,
    },
  });

  await prisma.aIGovernanceLog.create({
    data: {
      orgId: params.orgId,
      userId: params.userId,
      eventType: 'COST',
      details: {
        action: params.action,
        credits: params.credits,
        costValue: params.credits * CREDIT_VALUE_PER_UNIT,
        referenceId: params.referenceId,
        ...params.metadata,
      } as Prisma.InputJsonValue,
    },
  });

  return { success: true, newBalance };
}

export async function allocateCredits(orgId: string, amount: number, description: string, referenceId?: string): Promise<{ success: boolean; newBalance: number }> {
  const account = await prisma.creditAccount.findUnique({
    where: { orgId },
  });

  if (!account) {
    return { success: false, newBalance: 0 };
  }

  const newBalance = account.currentBalance + amount;

  await prisma.creditAccount.update({
    where: { orgId },
    data: {
      currentBalance: newBalance,
      totalAllocated: account.totalAllocated + amount,
      lastAllocatedAt: new Date(),
      lifetimeAllocated: { increment: amount },
    },
  });

  await prisma.creditTransaction.create({
    data: {
      accountId: account.id,
      type: 'ALLOCATION',
      amount,
      balanceAfter: newBalance,
      description,
      referenceId,
    },
  });

  return { success: true, newBalance };
}

export async function getCreditStatus(orgId: string) {
  const account = await prisma.creditAccount.findUnique({
    where: { orgId },
  });

  const subscription = await prisma.subscription.findUnique({
    where: { orgId },
  });

  if (!account || !subscription) {
    return null;
  }

  const plan = getPlan(subscription.planId as PlanId);
  const consumed = account.totalConsumed;
  const total = plan.monthlyCredits;
  const ratio = total > 0 ? consumed / total : 0;

  return {
    currentBalance: account.currentBalance,
    totalAllocated: account.totalAllocated,
    totalConsumed: account.totalConsumed,
    planCredits: total,
    usagePercentage: Math.round(ratio * 100),
    remainingCredits: Math.max(0, total - consumed),
    aiUsageValueConsumed: consumed * CREDIT_VALUE_PER_UNIT,
    aiUsageValueRemaining: Math.max(0, (total - consumed) * CREDIT_VALUE_PER_UNIT),
    thresholds: {
      warning50: ratio >= 0.5,
      warning75: ratio >= 0.75,
      warning90: ratio >= 0.9,
      exhausted: ratio >= 1.0,
    },
  };
}

export async function logAIUsage(params: {
  orgId: string;
  userId?: string;
  provider: ProviderType;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  latencyMs: number;
  action: string;
  referenceId?: string;
}) {
  const totalTokens = params.promptTokens + params.completionTokens;
  const credits = Math.ceil(totalTokens / 1000);

  await prisma.aIGovernanceLog.create({
    data: {
      orgId: params.orgId,
      userId: params.userId,
      eventType: 'MODEL_USED',
      aiModel: params.model,
      provider: params.provider,
      promptTokens: params.promptTokens,
      completionTokens: params.completionTokens,
      costUsd: params.costUsd,
      latencyMs: params.latencyMs,
      details: {
        action: params.action,
        totalTokens,
        creditsConsumed: credits,
      } as Prisma.InputJsonValue,
      traceId: params.referenceId,
    },
  });

  if (credits > 0) {
    await consumeCredits({
      orgId: params.orgId,
      userId: params.userId,
      action: params.action,
      description: `${params.action} - ${params.model}`,
      credits,
      referenceId: params.referenceId,
      metadata: {
        provider: params.provider,
        model: params.model,
        tokens: totalTokens,
        costUsd: params.costUsd,
      } as Record<string, unknown>,
    });
  }
}
