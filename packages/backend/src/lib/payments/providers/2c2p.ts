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

const TWO_C2P_API_URL = process.env.TWO_C2P_API_URL || 'https://api.2c2p.com/api/v2';
const TWO_C2P_MERCHANT_ID = process.env.TWO_C2P_MERCHANT_ID || '';
const TWO_C2P_SECRET_KEY = process.env.TWO_C2P_SECRET_KEY || '';
const TWO_C2P_WEBHOOK_SECRET = process.env.TWO_C2P_WEBHOOK_SECRET || '';

function getIdempotencyKey(): string {
  return `lm_${crypto.randomBytes(16).toString('hex')}`;
}

function generateSignature(payload: string): string {
  return crypto
    .createHash('sha256')
    .update(payload + TWO_C2P_SECRET_KEY)
    .digest('hex');
}

export class TwoC2PPaymentProvider implements PaymentProviderInterface {
  readonly provider = '2c2p' as const;
  
  readonly capabilities: ProviderCapabilities = {
    supportsRecurringPayments: true,
    supportsSubscriptions: true,
    supportsLocalPaymentMethods: true,
    supportsRefunds: true,
    supportsPartialRefunds: true,
    supportsRecurringBankDebit: true,
    supportsCards: true,
    supportsWallets: true,
    supportsQR: true,
    supportsBankTransfer: true,
    supportsHostedCheckout: true,
    supportsInlineCheckout: false,
  };

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'MerchantId': TWO_C2P_MERCHANT_ID,
      'Signature': '',
    };
  }

  async createCustomer(params: CreateCustomerParams): Promise<string> {
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      referenceNo: params.organisationId || getIdempotencyKey(),
      customerEmail: params.email,
      customerName: params.name,
      customerPhone: params.phone,
      description: `Law Mate customer ${params.email}`,
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/customer`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Signature': signature },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`2C2P customer creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return data.customerToken || data.token || data.id;
  }

  async getCustomer(customerId: string): Promise<Customer | null> {
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      customerToken: customerId,
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/customer/${customerId}`, {
      method: 'GET',
      headers: { ...this.getHeaders(), 'Signature': signature },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`2C2P get customer failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      id: customerId,
      email: data.customerEmail || '',
      name: data.customerName,
      phone: data.customerPhone,
      provider: '2c2p',
      providerCustomerId: customerId,
      createdAt: new Date(data.createdDate || Date.now()),
      updatedAt: new Date(data.updatedDate || Date.now()),
    };
  }

  async createPayment(params: CreatePaymentParams): Promise<Payment> {
    const now = new Date();
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      orderId: params.idempotencyKey,
      description: params.description,
      amount: params.amount.toFixed(2),
      currencyCode: params.currency,
      customerEmail: '',
      customerName: '',
      returnUrl: params.returnUrl,
      callbackUrl: params.webhookUrl,
      paymentReference: '',
      recurring: false,
      recurrenceAmount: 0,
      recurrenceCycle: '',
      recurrenceInterval: 0,
      recurrenceCount: 0,
      storedCardUniqueId: '',
      enableStoreCard: false,
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/payment`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Signature': signature },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`2C2P payment creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return this.mapPayment(data, params);
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      orderId: paymentId,
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/payment/${paymentId}`, {
      method: 'GET',
      headers: { ...this.getHeaders(), 'Signature': signature },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`2C2P get payment failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return this.mapPayment(data, { customerId: '', amount: 0, currency: 'MYR', idempotencyKey: '' });
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

    const sessionId = getIdempotencyKey();
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      orderId: sessionId,
      description: `Law Mate ${plan.planName} Subscription`,
      amount: params.amount.toFixed(2),
      currencyCode: params.currency,
      customerEmail: '',
      customerName: '',
      returnUrl: params.successUrl,
      callbackUrl: params.cancelUrl,
      paymentChannel: this.getPaymentChannels(params.currency),
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/checkout`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Signature': signature },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`2C2P checkout creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return {
      checkoutUrl: data.paymentUrl || data.checkoutUrl || '',
      sessionId,
    };
  }

  private getPaymentChannels(currency: string): string[] {
    const channels: Record<string, string[]> = {
      MYR: ['CARD', 'FPX', 'E_WALLET'],
      IDR: ['CARD', 'E_WALLET', 'VIRTUAL_ACCOUNT'],
      SGD: ['CARD', 'PAYNOW'],
      THB: ['CARD', 'PROMPTPAY'],
      PHP: ['CARD', 'E_WALLET'],
      VND: ['CARD', 'E_WALLET'],
    };
    return channels[currency] || ['CARD'];
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<Subscription> {
    const plan = getPlan(params.planId);
    if (!plan) throw new Error(`Invalid plan: ${params.planId}`);

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      recurringNo: getIdempotencyKey(),
      customerToken: params.customerId,
      description: `Law Mate ${plan.planName} Monthly`,
      amount: plan.monthlyPrice.toFixed(2),
      currencyCode: 'MYR',
      recurrenceInterval: 1,
      recurrenceCycle: 'M',
      recurrenceCount: 999,
      chargeOn: now.toISOString(),
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/recurring`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Signature': signature },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`2C2P subscription creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return {
      id: data.recurringNo || data.subscriptionId || getIdempotencyKey(),
      organisationId: (params.metadata as Record<string, string>)?.organisation_id || '',
      planId: params.planId,
      provider: '2c2p',
      providerSubscriptionId: data.recurringNo,
      customerId: params.customerId,
      currency: 'MYR',
      amount: plan.monthlyPrice,
      billingInterval: 'monthly',
      status: this.mapSubscriptionStatus(data.status || 'PENDING'),
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: false,
      createdAt: now,
      updatedAt: now,
    };
  }

  async cancelSubscription(params: { subscriptionId: string; immediate?: boolean; reason?: string }): Promise<Subscription> {
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      recurringNo: params.subscriptionId,
      action: 'CANCEL',
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/recurring/${params.subscriptionId}`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Signature': signature },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`2C2P subscription cancellation failed: ${error}`);
    }

    const data = await response.json() as any;
    const now = new Date();
    return {
      id: params.subscriptionId,
      organisationId: '',
      planId: 'lawyer',
      provider: '2c2p',
      providerSubscriptionId: params.subscriptionId,
      customerId: '',
      currency: 'MYR',
      amount: 0,
      billingInterval: 'monthly',
      status: 'cancelled',
      currentPeriodStart: now,
      currentPeriodEnd: now,
      cancelAtPeriodEnd: false,
      cancelledAt: now,
      createdAt: now,
      updatedAt: now,
    };
  }

  async pauseSubscription(params: { subscriptionId: string; pauseAt?: Date }): Promise<Subscription> {
    return this.getSubscription(params.subscriptionId) as Promise<Subscription>;
  }

  async resumeSubscription(params: { subscriptionId: string; resumeAt?: Date }): Promise<Subscription> {
    return this.getSubscription(params.subscriptionId) as Promise<Subscription>;
  }

  async updateSubscription(params: { subscriptionId: string; planId?: PlanId; paymentMethod?: PaymentMethod; trialPeriodDays?: number }): Promise<Subscription> {
    return this.getSubscription(params.subscriptionId) as Promise<Subscription>;
  }

  async getSubscription(subscriptionId: string): Promise<Subscription | null> {
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      recurringNo: subscriptionId,
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/recurring/${subscriptionId}`, {
      method: 'GET',
      headers: { ...this.getHeaders(), 'Signature': signature },
    });

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`2C2P get subscription failed: ${response.statusText}`);
    }

    const data = await response.json() as any;
    return {
      id: subscriptionId,
      organisationId: '',
      planId: 'lawyer',
      provider: '2c2p',
      providerSubscriptionId: subscriptionId,
      customerId: data.customerToken || '',
      currency: data.currencyCode || 'MYR',
      amount: parseFloat(data.amount || '0'),
      billingInterval: 'monthly',
      status: this.mapSubscriptionStatus(data.status),
      currentPeriodStart: new Date(data.nextChargeDate || Date.now()),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      cancelAtPeriodEnd: false,
      createdAt: new Date(data.createdDate || Date.now()),
      updatedAt: new Date(data.updatedDate || Date.now()),
    };
  }

  async getSubscriptionByProviderId(providerSubscriptionId: string): Promise<Subscription | null> {
    return this.getSubscription(providerSubscriptionId);
  }

  async createRefund(params: CreateRefundParams): Promise<Refund> {
    const payload = JSON.stringify({
      merchantId: TWO_C2P_MERCHANT_ID,
      orderId: params.paymentId,
      refundAmount: (params.amount || 0).toFixed(2),
      reason: params.reason,
    });

    const signature = generateSignature(payload);
    const response = await fetch(`${TWO_C2P_API_URL}/refund`, {
      method: 'POST',
      headers: { ...this.getHeaders(), 'Signature': signature },
      body: payload,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`2C2P refund creation failed: ${error}`);
    }

    const data = await response.json() as any;
    return {
      id: data.refundId || getIdempotencyKey(),
      paymentId: params.paymentId,
      providerRefundId: data.refundId,
      amount: params.amount || 0,
      currency: 'MYR',
      status: data.status === 'SUCCESS' ? 'succeeded' : 'pending',
      reason: params.reason,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  async getRefund(refundId: string): Promise<Refund | null> {
    return null;
  }

  async getPaymentMethods(customerId: string): Promise<PaymentMethod[]> {
    return ['card', 'bank_transfer', 'wallet', 'qr'];
  }

  async verifyWebhook(payload: unknown, signature: string, headers?: Record<string, string>): Promise<WebhookEvent> {
    const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
    
    if (TWO_C2P_WEBHOOK_SECRET) {
      const expectedSignature = crypto
        .createHmac('sha256', TWO_C2P_WEBHOOK_SECRET)
        .update(rawPayload)
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }
    }

    const event = typeof payload === 'string' ? JSON.parse(payload) : payload;
    
    return {
      id: (event.orderId || event.transactionId || getIdempotencyKey()),
      provider: '2c2p',
      eventId: event.orderId || event.transactionId || '',
      eventType: event.responseCode === '00' ? 'payment.succeeded' : 'payment.failed',
      payload: event,
      receivedAt: new Date(),
      processingStatus: 'pending',
      retryCount: 0,
      createdAt: new Date(),
    };
  }

  async handleWebhook(event: WebhookEvent): Promise<void> {
  }

  async getTransaction(transactionId: string): Promise<Payment | null> {
    return this.getPayment(transactionId);
  }

  async getProviderConfig(): Promise<{ apiKey?: string; webhookSecret?: string; isEnabled: boolean }> {
    return {
      apiKey: TWO_C2P_MERCHANT_ID ? '***' : undefined,
      webhookSecret: TWO_C2P_WEBHOOK_SECRET ? '***' : undefined,
      isEnabled: !!TWO_C2P_MERCHANT_ID && !!TWO_C2P_SECRET_KEY,
    };
  }

  private mapPayment(data: Record<string, unknown>, params: CreatePaymentParams): Payment {
    const isSuccess = data.responseCode === '00' || data.status === 'SUCCESS';
    
    return {
      id: (data.orderId || data.transactionId || getIdempotencyKey()) as string,
      customerId: params.customerId,
      organisationId: (data.metadata as Record<string, string>)?.organisation_id || (params.metadata as Record<string, string>)?.organisation_id || '',
      provider: '2c2p',
      providerPaymentId: data.transactionId as string,
      currency: (data.currencyCode || params.currency || 'MYR') as string,
      amount: parseFloat((data.amount || params.amount || 0).toString()),
      status: isSuccess ? 'succeeded' : (data.status === 'PENDING' ? 'pending' : 'failed'),
      paymentMethod: this.mapPaymentMethod(data.paymentMethod as string),
      providerMethod: data.paymentMethod as string,
      description: data.description as string,
      idempotencyKey: params.idempotencyKey,
      metadata: data.metadata as Record<string, string>,
      paidAt: isSuccess ? new Date() : undefined,
      failedAt: !isSuccess && data.status === 'FAILED' ? new Date() : undefined,
      createdAt: new Date(data.createdDate as string || Date.now()),
      updatedAt: new Date(data.updatedDate as string || Date.now()),
    };
  }

  private mapSubscriptionStatus(status: string): Subscription['status'] {
    const map: Record<string, Subscription['status']> = {
      ACTIVE: 'active',
      PENDING: 'pending',
      SUBSCRIBED: 'active',
      UNSUBSCRIBED: 'cancelled',
      EXPIRED: 'expired',
      CANCELLED: 'cancelled',
      SUSPENDED: 'paused',
    };
    return map[status?.toUpperCase()] || 'pending';
  }

  private mapPaymentMethod(method: string): PaymentMethod {
    const map: Record<string, PaymentMethod> = {
      CARD: 'card',
      FPX: 'bank_transfer',
      E_WALLET: 'wallet',
      QRIS: 'qr',
      PAYNOW: 'wallet',
      PROMPTPAY: 'qr',
      VIRTUAL_ACCOUNT: 'virtual_account',
    };
    return map[method?.toUpperCase()] || 'other';
  }
}

export const twoC2PPaymentProvider = new TwoC2PPaymentProvider();
