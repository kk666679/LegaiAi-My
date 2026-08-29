import type { PlanId } from '../pricing';

export type PaymentProvider = 'xendit' | '2c2p' | 'stripe' | 'internal';

export type PaymentMethod = 
  | 'card'
  | 'bank_transfer'
  | 'online_banking'
  | 'qr'
  | 'wallet'
  | 'direct_debit'
  | 'virtual_account'
  | 'e_wallet'
  | 'other';

export type PaymentStatus =
  | 'pending'
  | 'processing'
  | 'requires_action'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'refunded'
  | 'partially_refunded'
  | 'expired';

export type SubscriptionStatus =
  | 'trialing'
  | 'pending'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'cancelled'
  | 'expired'
  | 'payment_failed'
  | 'incomplete';

export type BillingInterval = 'monthly' | 'annual' | 'custom';

export interface Customer {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  organisationId?: string;
  provider: PaymentProvider;
  providerCustomerId?: string;
  countryCode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Payment {
  id: string;
  organisationId: string;
  userId?: string;
  subscriptionId?: string;
  customerId: string;
  provider: PaymentProvider;
  providerPaymentId?: string;
  providerCustomerId?: string;
  currency: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod;
  providerMethod?: string;
  countryCode?: string;
  description?: string;
  idempotencyKey?: string;
  metadata?: Record<string, string>;
  paidAt?: Date;
  failedAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Subscription {
  id: string;
  organisationId: string;
  userId?: string;
  planId: PlanId;
  provider: PaymentProvider;
  providerSubscriptionId?: string;
  customerId: string;
  currency: string;
  amount: number;
  billingInterval: BillingInterval;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  cancelledAt?: Date;
  trialEndsAt?: Date;
  pauseAt?: Date;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  organisationId: string;
  customerId: string;
  subscriptionId?: string;
  paymentId?: string;
  invoiceNumber: string;
  currency: string;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  status: 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  paidAt?: Date;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  metadata?: Record<string, string>;
}

export interface CreditLedgerEntry {
  id: string;
  organisationId: string;
  userId?: string;
  subscriptionId?: string;
  transactionType: CreditTransactionType;
  credits: number;
  balanceBefore: number;
  balanceAfter: number;
  referenceType?: string;
  referenceId?: string;
  description?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
}

export type CreditTransactionType =
  | 'subscription_allocation'
  | 'ai_usage'
  | 'credit_purchase'
  | 'credit_adjustment'
  | 'credit_expiration'
  | 'refund_reversal'
  | 'admin_adjustment'
  | 'promotion';

export interface PaymentProviderAccount {
  id: string;
  provider: PaymentProvider;
  name: string;
  apiKey?: string;
  apiSecret?: string;
  webhookSecret?: string;
  isDefault: boolean;
  isEnabled: boolean;
  config?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRoutingRule {
  id: string;
  countryCode?: string;
  currency?: string;
  paymentMethod?: PaymentMethod;
  customerSegment?: string;
  planId?: PlanId;
  transactionValueMin?: number;
  transactionValueMax?: number;
  provider: PaymentProvider;
  priority: number;
  isEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  provider: PaymentProvider;
  eventId: string;
  eventType: string;
  payload: unknown;
  signature?: string;
  receivedAt: Date;
  processedAt?: Date;
  processingStatus: 'pending' | 'processing' | 'processed' | 'failed';
  errorMessage?: string;
  retryCount: number;
  idempotencyKey?: string;
  createdAt: Date;
}

export interface Refund {
  id: string;
  paymentId: string;
  providerRefundId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'cancelled';
  reason?: string;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Chargeback {
  id: string;
  paymentId: string;
  providerChargebackId?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'won' | 'lost';
  reason?: string;
  evidenceDeadline?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CountryConfig {
  countryCode: string;
  countryName: string;
  currency: string;
  timezone: string;
  defaultPaymentProvider: PaymentProvider;
  enabled: boolean;
  taxEnabled: boolean;
  subscriptionEnabled: boolean;
}

export interface TaxRule {
  id: string;
  countryCode: string;
  taxType: string;
  taxRate: number;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  inclusive: boolean;
  enabled: boolean;
}

export interface PlanPrice {
  id: string;
  planId: PlanId;
  countryCode: string;
  currency: string;
  amount: number;
  billingInterval: BillingInterval;
  provider: PaymentProvider;
  providerPriceId?: string;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  status: 'active' | 'inactive';
}

export interface Promotion {
  id: string;
  planId: PlanId;
  type: 'founding' | 'seasonal' | 'launch' | 'referral';
  promotionalPrice: number;
  standardPrice: number;
  startDate: Date;
  endDate: Date;
  maxRedemptions?: number;
  redemptionCount: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ProviderCapabilities {
  supportsRecurringPayments: boolean;
  supportsSubscriptions: boolean;
  supportsLocalPaymentMethods: boolean;
  supportsRefunds: boolean;
  supportsPartialRefunds: boolean;
  supportsRecurringBankDebit: boolean;
  supportsCards: boolean;
  supportsWallets: boolean;
  supportsQR: boolean;
  supportsBankTransfer: boolean;
  supportsHostedCheckout: boolean;
  supportsInlineCheckout: boolean;
}

export interface ProviderTransactionSummary {
  provider: PaymentProvider;
  totalVolume: number;
  transactionCount: number;
  successfulCount: number;
  failedCount: number;
  totalFees: number;
  netSettlement: number;
  currency: string;
  periodStart: Date;
  periodEnd: Date;
}
