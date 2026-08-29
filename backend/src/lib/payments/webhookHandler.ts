import crypto from 'crypto';
import { prisma } from '../../db';
import { billingService } from './billingService';
import { xenditPaymentProvider } from './providers/xendit';
import { twoC2PPaymentProvider } from './providers/2c2p';
import { isSubscriptionStatusUpdate, isPaymentStatusUpdate } from './provider.interface';
import type { PaymentProvider, WebhookEvent } from './types';
import { Prisma } from '@prisma/client';

export interface WebhookHandlerResult {
  success: boolean;
  eventId: string;
  action: string;
  error?: string;
}

export async function handleXenditWebhook(
  payload: unknown,
  signature: string,
  rawHeaders: Record<string, string>
): Promise<WebhookHandlerResult> {
  const event = await xenditPaymentProvider.verifyWebhook(payload, signature, rawHeaders);
  return processWebhookEvent('xendit', event);
}

export async function handle2C2PWebhook(
  payload: unknown,
  signature: string,
  rawHeaders: Record<string, string>
): Promise<WebhookHandlerResult> {
  const event = await twoC2PPaymentProvider.verifyWebhook(payload, signature, rawHeaders);
  return processWebhookEvent('2c2p', event);
}

async function processWebhookEvent(provider: PaymentProvider, event: WebhookEvent): Promise<WebhookHandlerResult> {
  const existingEvent = await prisma.paymentWebhookEvent.findUnique({
    where: {
      provider_eventId: {
        provider,
        eventId: event.eventId,
      },
    },
  });

  if (existingEvent) {
    return {
      success: true,
      eventId: event.eventId,
      action: 'duplicate_skipped',
    };
  }

  await prisma.paymentWebhookEvent.create({
    data: {
      provider,
      eventId: event.eventId,
      eventType: event.eventType,
      payload: event.payload as Prisma.InputJsonValue,
      signature: event.signature,
      receivedAt: event.receivedAt,
      processingStatus: 'processing',
    },
  });

  try {
    if (isSubscriptionStatusUpdate(event.eventType)) {
      await handleSubscriptionEvent(provider, event);
    } else if (isPaymentStatusUpdate(event.eventType)) {
      await handlePaymentEvent(provider, event);
    } else if (event.eventType.includes('invoice')) {
      await handleInvoiceEvent(provider, event);
    }

    await prisma.paymentWebhookEvent.update({
      where: { provider_eventId: { provider, eventId: event.eventId } },
      data: {
        processingStatus: 'processed',
        processedAt: new Date(),
      },
    });

    return {
      success: true,
      eventId: event.eventId,
      action: event.eventType,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    await prisma.paymentWebhookEvent.update({
      where: { provider_eventId: { provider, eventId: event.eventId } },
      data: {
        processingStatus: 'failed',
        errorMessage,
        retryCount: { increment: 1 },
      },
    });

    return {
      success: false,
      eventId: event.eventId,
      action: event.eventType,
      error: errorMessage,
    };
  }
}

async function handleSubscriptionEvent(provider: PaymentProvider, event: WebhookEvent) {
  const data = event.payload as Record<string, unknown>;
  const subscriptionExternalId = (data.subscription_id || data.id) as string;
  const status = (data.status || data.state) as string;

  let subscription = await findSubscriptionByProviderId(provider, subscriptionExternalId);

  if (!subscription && data.reference) {
    subscription = await prisma.subscription.findFirst({
      where: { providerSubscriptionId: String(data.reference) },
    });
  }

  if (!subscription) {
    console.log(`Subscription not found for event: ${event.eventType}`, { subscriptionExternalId, data });
    return;
  }

  switch (status?.toUpperCase()) {
    case 'ACTIVE':
      if (subscription.status !== 'ACTIVE') {
        await billingService.activateSubscription(subscription.id, subscriptionExternalId);
      }
      break;

    case 'TRIALING':
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'TRIALING' },
      });
      break;

    case 'PAUSED':
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { status: 'SUSPENDED' },
      });
      break;

    case 'CANCELLED':
    case 'EXPIRED':
      await billingService.cancelSubscription(subscription.id, true);
      break;

    case 'FAILED':
      await billingService.handlePaymentFailure(subscription.id, `Provider status: ${status}`);
      break;

    default:
      console.log(`Unhandled subscription status: ${status}`);
  }

  await prisma.paymentAuditLog.create({
    data: {
      orgId: subscription.orgId,
      action: `subscription.${event.eventType}`,
      subscriptionId: subscription.id,
      metadata: { provider, status, eventId: event.eventId } as Prisma.InputJsonValue,
    },
  });
}

async function handlePaymentEvent(provider: PaymentProvider, event: WebhookEvent) {
  const data = event.payload as Record<string, unknown>;
  const paymentExternalId = (data.payment_id || data.transaction_id || data.id) as string;
  const status = (data.status || data.state) as string;

  let payment = await prisma.paymentRecord.findFirst({
    where: { providerPaymentId: paymentExternalId },
  });

  if (!payment && data.order_id) {
    payment = await prisma.paymentRecord.findFirst({
      where: { idempotencyKey: String(data.order_id) },
    });
  }

  if (!payment) {
    console.log(`Payment not found for event: ${event.eventType}`, { paymentExternalId, data });
    return;
  }

  switch (status?.toUpperCase()) {
    case 'PAID':
    case 'SUCCESS':
    case 'COMPLETED':
      if (payment.status !== 'succeeded') {
        await prisma.paymentRecord.update({
          where: { id: payment.id },
          data: {
            status: 'succeeded',
            paidAt: new Date(),
          },
        });

        if (payment.subscriptionId) {
          await billingService.handlePaymentSuccess(payment.subscriptionId, paymentExternalId);
        }
      }
      break;

    case 'FAILED':
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: {
          status: 'failed',
          failedAt: new Date(),
        },
      });

      if (payment.subscriptionId) {
        await billingService.handlePaymentFailure(payment.subscriptionId, `Provider status: ${status}`);
      }
      break;

    case 'CANCELLED':
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });
      break;

    case 'REFUNDED':
      await prisma.paymentRecord.update({
        where: { id: payment.id },
        data: { status: 'refunded' },
      });
      break;

    default:
      console.log(`Unhandled payment status: ${status}`);
  }

  await prisma.paymentAuditLog.create({
    data: {
      orgId: payment.organisationId,
      action: `payment.${event.eventType}`,
      paymentId: payment.id,
      metadata: { provider, status, eventId: event.eventId } as Prisma.InputJsonValue,
    },
  });
}

async function handleInvoiceEvent(provider: PaymentProvider, event: WebhookEvent) {
  const data = event.payload as Record<string, unknown>;
  const invoiceId = (data.invoice_id || data.id) as string;

  console.log(`Invoice event: ${event.eventType}`, { invoiceId, data });
}

async function findSubscriptionByProviderId(provider: PaymentProvider, externalId: string) {
  switch (provider) {
    case 'xendit':
      return prisma.subscription.findFirst({
        where: {
          OR: [
            { providerSubscriptionId: externalId },
            { providerSubscriptionId: String(externalId) },
          ],
        },
      });
    case '2c2p':
      return prisma.subscription.findFirst({
        where: {
          OR: [
            { providerSubscriptionId: externalId },
            { providerSubscriptionId: String(externalId) },
          ],
        },
      });
    default:
      return null;
  }
}

export async function retryFailedWebhooks(provider?: PaymentProvider) {
  const where: Record<string, unknown> = {
    processingStatus: 'failed',
    retryCount: { lt: 5 },
  };

  if (provider) {
    where.provider = provider;
  }

  const failedEvents = await prisma.paymentWebhookEvent.findMany({
    where,
    orderBy: { receivedAt: 'asc' },
    take: 10,
  });

  for (const event of failedEvents) {
    try {
      const webhookEvent: WebhookEvent = {
        id: event.id,
        provider: event.provider as PaymentProvider,
        eventId: event.eventId,
        eventType: event.eventType,
        payload: event.payload,
        receivedAt: event.receivedAt,
        processingStatus: 'pending',
        retryCount: event.retryCount,
        createdAt: new Date(),
      };

      await processWebhookEvent(event.provider as PaymentProvider, webhookEvent);
    } catch (error) {
      console.error(`Failed to retry webhook ${event.id}:`, error);
    }
  }

  return { processed: failedEvents.length };
}
