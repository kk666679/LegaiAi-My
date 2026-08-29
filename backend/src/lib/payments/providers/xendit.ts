import crypto from 'crypto';
import type {
  Customer,
  Payment,
  Subscription,
  PaymentMethod,
  ProviderCapabilities,
  WebhookEvent,
  Refund,
} from '../types';
import type { CreateCustomerParams, CreatePaymentParams, CreateSubscriptionParams, CreateRefundParams, PaymentProviderInterface } from '../provider.interface';
import type { PlanId } from '../../pricing';
import { getPlan } from '../../pricing';

const XENDIT_API_URL = process.env.XENDIT_API_URL || 'https://api.xendit.co';
const XENDIT_API_KEY = process.env.XENDIT_API_KEY || '';
const XENDIT_WEBHOOK_SECRET = process.env.XENDIT_WEBHOOK_SECRET || '';
const XENDIT_CALLBACK_PREFIX = process.env.XENDIT_CALLBACK_PREFIX || '';

function getIdempotencyKey(): string {
  return `lm_${crypto.randomBytes(16).toString('hex')}`;
}

export class XenditPaymentProvider implements PaymentProviderInterface {
  readonly provider = 'xendit' as const;
  
  readonly capabilities: ProviderCapabilities = {
    supportsRecurringPayments: true,
    supportsSubscriptions: true,
    supportsLocalPaymentMethods: true,
    supportsRefunds: true,
    supportsPartialRefunds: true,
    supportsRecurringBankDebit: false,
    supportsCards: true,
    supportsWallets: true,
    supportsQR: true,
    supportsBankTransfer: true,
    supportsHostedCheckout: true,
    supportsInlineCheckout: true,
  };

  private getHeaders() {
    const auth = Buffer.from(`${XENDIT_API_KEY}:`).toString('base64');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${auth}`,
      'X-Idempotency-Key': getIdempotencyKey(),
    };
  }

  async createCustomer(params: CreateCustomerParams): Promise<string> {
    const response = await fetch(`${XENDIT_API_URL}/customers`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        reference_id: params.organisationId || params.email,
        email: params.email,
        given_names: params.name?.split(' ')[0] || '',
        surname: params.name?.split(' ').slice(1).join(' ') || '',
        phone_number: params.phone,
        metadata: {
          ...params.metadata,
          organisation_id: params.organisationId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit customer creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return data.id;
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    const response = await fetch(`${XENDIT_API_URL}/customers/${customerId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Xendit get customer failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      id: data.id,
      email: data.email,
      name: `${data.given_names || ''} ${data.surname || ''}`.trim() || undefined,
      phone: data.phone_number,
      provider: 'xendit',
      providerCustomerId: data.id,
      countryCode: data.nationality,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    const response = await fetch(`${XENDIT_API_URL}/v2/payments`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        idempotency_key: params.idempotencyKey,
        amount: params.amount,
        currency: params.currency,
        payment_method: params.paymentMethod || 'CARD',
        payment_method_id: params.paymentMethod,
        description: params.description,
        metadata: params.metadata,
        callback_url: params.webhookUrl,
        redirect_url: params.returnUrl,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit payment creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return this.mapPayment(data);
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    const response = await fetch(`${XENDIT_API_URL}/v2/payments/${paymentId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Xendit get payment failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return this.mapPayment(data);
  }

  async getPaymentByProviderId(providerPaymentId: string): Promise<Payment | null> {
    return this.getPayment(providerPaymentId);
  }

  async createCheckoutSession(params: {
    customerId?: string;
    planId: PlanId;
    amount: number;
    currency: string;
    paymentMethod?: PaymentMethod;
    successUrl: string;
    cancelUrl: string;
    metadata?: Record<string, string>;
  }): Promise<{ checkoutUrl: string; sessionId: string }> {
    const plan = getPlan(params.planId);
    if (!plan) throw new Error(`Invalid plan: ${params.planId}`);

    const response = await fetch(`${XENDIT_API_URL}/v2/invoices`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        idempotency_key: getIdempotencyKey(),
        external_id: `lawmate_${params.planId}_${Date.now()}`,
        amount: params.amount,
        currency: params.currency,
        description: `Law Mate ${plan.planName} - Monthly Subscription`,
        payment_methods: this.getPaymentMethodsForCountry(params.currency),
        customer: params.customerId ? { id: params.customerId } : undefined,
        success_redirect_url: params.successUrl,
        failure_redirect_url: params.cancelUrl,
        metadata: {
          ...params.metadata,
          plan_id: params.planId,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit checkout creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return {
      checkoutUrl: data.invoice_url,
      sessionId: data.id,
    };
  }

  private getPaymentMethodsForCountry(currency: string): string[] {
    const methods: Record<string, string[]> = {
      MYR: ['CARD', 'FPX', 'E_WALLET', 'OVO', 'DANA', 'LINKAJA', 'QQWALLET', '嵌,'],
      IDR: ['CARD', 'E_WALLET', 'OVO', 'DANA', 'LINKAJA', 'SHOPEEPAY', 'QRIS'],
      SGD: ['CARD', 'PAYNOW', 'GRABPAY', 'SHOPEEPAY'],
      THB: ['CARD', 'PROMPTPAY', 'TRUEMONEY', 'LINEPAY'],
      PHP: ['CARD', 'GCASH', 'MAYA', 'BDO'],
      VND: ['CARD', 'ZALOPAY', 'MOMO', 'VNPAY'],
    };
    return methods[currency] || ['CARD'];
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    const plan = getPlan(params.planId);
    if (!plan) throw new Error(`Invalid plan: ${params.planId}`);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const response = await fetch(`${XENDIT_API_URL}/recurring/v3/subscriptions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        idempotency_key: getIdempotencyKey(),
        reference_id: `lawmate_sub_${Date.now()}`,
        customer_id: params.customerId,
        recurring_options: {
          plan_id: `lawmate_${params.planId}`,
          name: `Law Mate ${plan.planName}`,
          amount: plan.monthlyPrice,
          currency: 'MYR',
          interval: 'MONTH',
          interval_count: 1,
        },
        metadata: {
          plan_id: params.planId,
          ...params.metadata,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit subscription creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return this.mapSubscription(data, params.planId);
  }

  async cancelSubscription(params: { subscriptionId: string; immediate?: boolean; reason?: string }): Promise<Subscription> {
    const response = await fetch(`${XENDIT_API_URL}/recurring/v3/subscriptions/${params.subscriptionId}/stop`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit subscription cancellation failed: ${error}`);
    }

    const data = await response.json() as any;
    return this.mapSubscription(data, 'lawyer');
  }

  async pauseSubscription(params: { subscriptionId: string; pauseAt?: Date }): Promise<Subscription> {
    const response = await fetch(`${XENDIT_API_URL}/recurring/v3/subscriptions/${params.subscriptionId}/pause`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        pause_after_cycle: params.pauseAt ? Math.ceil((params.pauseAt.getTime() - Date.now()) / (30 * 24 * 60 * 60 * 1000)) : 1,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit subscription pause failed: ${error}`);
    }

    const data = await response.json() as any;
    return this.mapSubscription(data, 'lawyer');
  }

  async resumeSubscription(params: { subscriptionId: string; resumeAt?: Date }): Promise<Subscription> {
    const response = await fetch(`${XENDIT_API_URL}/recurring/v3/subscriptions/${params.subscriptionId}/resume`, {
      method: 'POST',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit subscription resume failed: ${error}`);
    }

    const data = await response.json() as any;
    return this.mapSubscription(data, 'lawyer');
  }

  async updateSubscription(params: { subscriptionId: string; planId?: PlanId; paymentMethod?: PaymentMethod; trialPeriodDays?: number }): Promise<Subscription> {
    const updateData: Record<string, unknown> = {
      idempotency_key: getIdempotencyKey(),
    };

    if (params.planId) {
      const plan = getPlan(params.planId);
      if (plan) {
        updateData.recurring_options = {
          plan_id: `lawmate_${params.planId}`,
          name: `Law Mate ${plan.planName}`,
          amount: plan.monthlyPrice,
        };
      }
    }

    const response = await fetch(`${XENDIT_API_URL}/recurring/v3/subscriptions/${params.subscriptionId}`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit subscription update failed: ${error}`);
    }

    const data = await response.json() as any;
    return this.mapSubscription(data, params.planId || 'lawyer');
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    const response = await fetch(`${XENDIT_API_URL}/recurring/v3/subscriptions/${subscriptionId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Xendit get subscription failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return this.mapSubscription(data, 'lawyer');
  }

  async getSubscriptionByProviderId(providerSubscriptionId: string): Promise<Subscription | null> {
    return this.getSubscription(providerSubscriptionId);
  }

  async createRefund(params: CreateRefundParams): Promise<Refund> {
    const response = await fetch(`${XENDIT_API_URL}/refunds`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        idempotency_key: params.idempotencyKey,
        payment_id: params.paymentId,
        amount: params.amount,
        reason: params.reason,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Xendit refund creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return {
      id: data.id,
      paymentId: data.payment_id,
      providerRefundId: data.id,
      amount: data.amount,
      currency: data.currency || 'MYR',
      status: this.mapRefundStatus(data.status),
      reason: params.reason,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.created_at),
    };
  }

  async getRefund(refundId: string): Promise<Refund | null> {
    const response = await fetch(`${XENDIT_API_URL}/refunds/${refundId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Xendit get refund failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      id: data.id,
      paymentId: data.payment_id,
      providerRefundId: data.id,
      amount: data.amount,
      currency: data.currency || 'MYR',
      status: this.mapRefundStatus(data.status),
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.created_at),
    };
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    const response = await fetch(`${XENDIT_API_URL}/customers/${customerId}/payment-methods`, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json() as any;
    return data.map((pm: { type: string }) => this.mapPaymentMethod(pm.type));
  }

  async verifyWebhook(payload: unknown, signature: string, headers?: Record<string, string>): Promise<WebhookEvent> {
    const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    if (XENDIT_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', XENDIT_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      if (signature !== expectedSignature && signature !== headers?.['x-xendit-idempotency-key']) {
        throw new Error('Invalid webhook signature');
      }
    }

    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
    
    return {
      id: event.id || event.reference,
      provider: 'xendit',
      eventId: event.id,
      eventType: event.type || event.event,
      payload: event,
      receivedAt: new Date(),
      processingStatus: 'pending',
      retryCount: 0,
      createdAt: new Date(),
    };
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
    // Webhook handling is done by the billing service
    // This method is for the interface contract
  }

  async getTransaction(transactionId: string): Promise<Payment | null> {
    return this.getPayment(transactionId);
  }

  async getProviderConfig(): Promise<{ apiKey?: string; webhookSecret?: string; isEnabled: boolean }> {
    return {
      apiKey: XENDIT_API_KEY ? '***' : undefined,
      webhookSecret: XENDIT_WEBHOOK_SECRET ? '***' : undefined,
      isEnabled: !!XENDIT_API_KEY,
    };
  }

  private mapPayment(data: Record<string, unknown>): Payment {
    return {
      id: data.id as string,
      customerId: (data.customer_id as string) || '',
      organisationId: (data.metadata as Record<string, string>)?.organisation_id || '',
      provider: 'xendit',
      providerPaymentId: data.id as string,
      currency: data.currency as string,
      amount: data.amount as number,
      status: this.mapPaymentStatus(data.status as string),
      paymentMethod: this.mapPaymentMethod(data.payment_method as string),
      providerMethod: data.payment_method as string,
      description: data.description as string,
      idempotencyKey: data.idempotency_key as string,
      metadata: data.metadata as Record<string, string>,
      paidAt: data.paid_at ? new Date(data.paid_at as string) : undefined,
      failedAt: data.failed_at ? new Date(data.failed_at as string) : undefined,
      createdAt: new Date(data.created_at as string),
      updatedAt: new Date(data.updated_at as string),
    };
  }

  private mapSubscription(data: Record<string, unknown>, planId: PlanId): Subscription {
    const recurringData = (data.recurring_options || data) as Record<string, unknown>;
    
    return {
      id: data.id as string,
      organisationId: (data.metadata as Record<string, string>)?.organisation_id || '',
      planId: ((data.metadata as Record<string, string>)?.plan_id as PlanId) || planId,
      provider: 'xendit',
      providerSubscriptionId: data.id as string,
      customerId: data.customer_id as string,
      currency: (recurringData.currency as string) || 'MYR',
      amount: (recurringData.amount as number) || 0,
      billingInterval: 'monthly',
      status: this.mapSubscriptionStatus(data.status as string),
      currentPeriodStart: new Date(data.current_period_start as string || Date.now()),
      currentPeriodEnd: new Date(data.current_period_end as string || Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(data.created_at as string || Date.now()),
      updatedAt: new Date(data.updated_at as string || Date.now()),
    };
  }

  private mapPaymentStatus(status: string): Payment['status'] {
    const map: Record<string, Payment['status']> = {
      PENDING: 'pending',
      INVOICE_ISSUED: 'pending',
      ISSUED: 'pending',
      PAID: 'succeeded',
      SUCCESS: 'succeeded',
      FAILED: 'failed',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled',
      REFUNDED: 'refunded',
      PARTIALLY_REFUNDED: 'partially_refunded',
    };
    return map[status] || 'pending';
  }

  private mapSubscriptionStatus(status: string): Subscription['status'] {
    const map: Record<string, Subscription['status']> = {
      ACTIVE: 'active',
      PENDING: 'pending',
      TRIALING: 'trialing',
      PAUSED: 'paused',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired',
      FAILED: 'payment_failed',
    };
    return map[status] || 'pending';
  }

  private mapRefundStatus(status: string): Refund['status'] {
    const map: Record<string, Refund['status']> = {
      PENDING: 'pending',
      SUCCEEDED: 'succeeded',
      FAILED: 'failed',
      CANCELLED: 'cancelled',
    };
    return map[status] || 'pending';
  }

  private mapPaymentMethod(method: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      CARD: 'card',
      FPX: 'bank_transfer',
      E_WALLET: 'wallet',
      QRIS: 'qr',
      PAYNOW: 'wallet',
      PROMPTPAY: 'qr',
      GCASH: 'wallet',
      MAYA: 'wallet',
      OVO: 'wallet',
      DANA: 'wallet',
      SHOPEEPAY: 'wallet',
      TRUEMONEY: 'wallet',
      ZALOPAY: 'wallet',
      MOMO: 'wallet',
      VNPAY: 'bank_transfer',
    };
    return map[method] || 'other';
  }
}

export const xenditPaymentProvider = new XenditPaymentProvider();
