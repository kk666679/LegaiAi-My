import type {
  Customer,
  Payment,
  Subscription,
  PaymentMethod,
  SubscriptionStatus,
  ProviderCapabilities,
  WebhookEvent,
  Refund,
  CountryConfig,
} from './types';
import type { PlanId } from '../pricing';

export interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  organisationId?: string;
  countryCode?: string;
  metadata?: Record<string, string>;
}

export interface CreatePaymentParams {
  customerId: string;
  amount: number;
  currency: string;
  paymentMethod?: PaymentMethod;
  description?: string;
  idempotencyKey: string;
  metadata?: Record<string, string>;
  returnUrl?: string;
  webhookUrl?: string;
}

export interface CreateSubscriptionParams {
  customerId: string;
  planId: PlanId;
  email: string;
  paymentMethod?: PaymentMethod;
  trialPeriodDays?: number;
  metadata?: Record<string, string>;
}

export interface UpdateSubscriptionParams {
  subscriptionId: string;
  planId?: PlanId;
  paymentMethod?: PaymentMethod;
  trialPeriodDays?: number;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  immediate?: boolean;
  reason?: string;
}

export interface PauseSubscriptionParams {
  subscriptionId: string;
  pauseAt?: Date;
}

export interface ResumeSubscriptionParams {
  subscriptionId: string;
  resumeAt?: Date;
}

export interface CreateRefundParams {
  paymentId: string;
  amount?: number;
  reason?: string;
  idempotencyKey: string;
}

export interface PaymentProviderInterface {
  readonly provider: import('./types').PaymentProvider;
  readonly capabilities: ProviderCapabilities;

  createCustomer(params: CreateCustomerParams): Promise<string>;
  getCustomer(customerId: string): Promise<Customer | null>;

  createPayment(params: CreatePaymentParams): Promise<Payment>;
  getPayment(paymentId: string): Promise<Payment | null>;
  getPaymentByProviderId(providerPaymentId: string): Promise<Payment | null>;

  createCheckoutSession(params: {
    customerId?: string;
    planId: PlanId;
    amount: number;
    currency: string;
    paymentMethod?: PaymentMethod;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ checkoutUrl: string; sessionId: string }>;

  createSubscription(params: CreateSubscriptionParams): Promise<Subscription>;
  cancelSubscription(params: CancelSubscriptionParams): Promise<Subscription>;
  pauseSubscription(params: PauseSubscriptionParams): Promise<Subscription>;
  resumeSubscription(params: ResumeSubscriptionParams): Promise<Subscription>;
  updateSubscription(params: UpdateSubscriptionParams): Promise<Subscription>;
  getSubscription(subscriptionId: string): Promise<Subscription | null>;
  getSubscriptionByProviderId(providerSubscriptionId: string): Promise<Subscription | null>;

  createRefund(params: CreateRefundParams): Promise<Refund>;
  getRefund(refundId: string): Promise<Refund | null>;

  getPaymentMethods(customerId: string): Promise<PaymentMethod[]>;

  verifyWebhook(payload: unknown, signature: string, headers?: Record<string, string>): Promise<WebhookEvent>;
  handleWebhook(event: WebhookEvent): Promise<void>;

  getTransaction(transactionId: string): Promise<Payment | null>;

  getProviderConfig(): Promise<{
    apiKey?: string;
    webhookSecret?: string;
    isEnabled: boolean;
  }>;
}

export interface PaymentProviderFactory {
  getProvider(provider: import('./types').PaymentProvider): PaymentProviderInterface;
  getDefaultProvider(countryCode?: string): PaymentProviderInterface;
  getAvailableProviders(): import('./types').PaymentProvider[];
}

export function isSubscriptionStatusUpdate(eventType: string): boolean {
  const subscriptionEvents = [
    'subscription.created',
    'subscription.updated',
    'subscription.cancelled',
    'subscription.renewed',
    'subscription.paused',
    'subscription.resumed',
    'subscription.trial_started',
    'subscription.trial_ended',
    'subscription.payment_failed',
  ];
  return subscriptionEvents.includes(eventType);
}

export function isPaymentStatusUpdate(eventType: string): boolean {
  const paymentEvents = [
    'payment.succeeded',
    'payment.failed',
    'payment.cancelled',
    'payment.refunded',
    'payment.partially_refunded',
  ];
  return paymentEvents.includes(eventType);
}

export function mapProviderStatus(
  provider: import('./types').PaymentProvider,
  rawStatus: string
): SubscriptionStatus {
  const statusMap: Record<string, Record<string, SubscriptionStatus>> = {
    xendit: {
      ACTIVE: 'active',
      PENDING: 'pending',
      TRIALING: 'trialing',
      PAUSED: 'paused',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired',
      FAILED: 'payment_failed',
    },
    '2c2p': {
      ACTIVE: 'active',
      PENDING: 'pending',
      IN_PROGRESS: 'incomplete',
      SUBSCRIBED: 'active',
      UNSUBSCRIBED: 'cancelled',
      EXPIRED: 'expired',
    },
    stripe: {
      active: 'active',
      trialing: 'trialing',
      past_due: 'past_due',
      canceled: 'cancelled',
      unpaid: 'payment_failed',
      incomplete: 'incomplete',
    },
  };

  return statusMap[provider]?.[rawStatus] || 'pending';
}

export function mapPaymentStatus(
  provider: import('./types').PaymentProvider,
  rawStatus: string
): import('./types').PaymentStatus {
  const statusMap: Record<string, Record<string, import('./types').PaymentStatus>> = {
    xendit: {
      PENDING: 'pending',
      INVOICE: 'pending',
      ISSUED: 'pending',
      PAID: 'succeeded',
      FAILED: 'failed',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
      PARTIALLY_REFUNDED: 'partially_refunded',
    },
    '2c2p': {
      PENDING: 'pending',
      PROCESSING: 'processing',
      SUCCESS: 'succeeded',
      FAIL: 'failed',
      CANCEL: 'cancelled',
    },
    stripe: {
      requires_payment_method: 'pending',
      requires_confirmation: 'pending',
      requires_action: 'requires_action',
      processing: 'processing',
      requires_capture: 'processing',
      succeeded: 'succeeded',
      canceled: 'cancelled',
      refunded: 'refunded',
      partially_refunded: 'partially_refunded',
    },
  };

  return statusMap[provider]?.[rawStatus] || 'pending';
}
