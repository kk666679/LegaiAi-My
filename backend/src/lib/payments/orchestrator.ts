import type { PaymentProvider, PaymentMethod, CountryConfig } from './types';
import type { PaymentProviderInterface } from './provider.interface';
import type { PlanId } from '../pricing';
import { xenditPaymentProvider } from './providers/xendit';
import { twoC2PPaymentProvider } from './providers/2c2p';

export interface PaymentRoutingParams {
  countryCode?: string;
  currency?: string;
  paymentMethod?: PaymentMethod;
  customerSegment?: string;
  planId?: PlanId;
  transactionValue?: number;
}

export interface CreateCheckoutParams {
  organisationId: string;
  userId?: string;
  planId: PlanId;
  email: string;
  countryCode: string;
  currency: string;
  paymentMethod?: PaymentMethod;
  successUrl: string;
  cancelUrl: string;
}

export interface ProviderStatus {
  provider: PaymentProvider;
  isEnabled: boolean;
  isAvailable: boolean;
  lastHealthCheck?: Date;
}

export class PaymentOrchestrator {
  private providers: Map<PaymentProvider, PaymentProviderInterface> = new Map();
  private routingRules: PaymentRoutingRule[] = [];
  private countryConfigs: Map<string, CountryConfig> = new Map();
  private providerHealth: Map<PaymentProvider, { healthy: boolean; lastCheck: Date }> = new Map();

  constructor() {
    this.registerProvider('xendit', xenditPaymentProvider);
    this.registerProvider('2c2p', twoC2PPaymentProvider);
    this.initializeDefaultRoutingRules();
    this.initializeDefaultCountryConfigs();
  }

  registerProvider(provider: PaymentProvider, implementation: PaymentProviderInterface): void {
    this.providers.set(provider, implementation);
  }

  getProvider(provider: PaymentProvider): PaymentProviderInterface | null {
    return this.providers.get(provider) || null;
  }

  getAvailableProviders(): PaymentProvider[] {
    return Array.from(this.providers.keys()).filter(p => {
      const health = this.providerHealth.get(p);
      return !health || health.healthy;
    });
  }

  async selectProvider(params: PaymentRoutingParams): Promise<PaymentProvider> {
    const matchingRules = this.routingRules
      .filter(rule => this.ruleMatches(rule, params))
      .sort((a, b) => a.priority - b.priority);

    if (matchingRules.length > 0) {
      const selectedRule = matchingRules[0]!;
      if (selectedRule.provider && this.isProviderHealthy(selectedRule.provider)) {
        return selectedRule.provider;
      }
    }

    if (params.countryCode) {
      const countryConfig = this.countryConfigs.get(params.countryCode);
      if (countryConfig?.defaultPaymentProvider) {
        return countryConfig.defaultPaymentProvider;
      }
    }

    if (this.isProviderHealthy('xendit')) {
      return 'xendit';
    }

    const available = this.getAvailableProviders();
    if (available.length > 0) {
      return available[0]!;
    }

    return 'xendit';
  }

  private ruleMatches(rule: PaymentRoutingRule, params: PaymentRoutingParams): boolean {
    if (!rule.isEnabled) return false;

    if (rule.countryCode && rule.countryCode !== params.countryCode) return false;
    if (rule.currency && rule.currency !== params.currency) return false;
    if (rule.paymentMethod && rule.paymentMethod !== params.paymentMethod) return false;
    if (rule.planId && rule.planId !== params.planId) return false;

    if (rule.transactionValueMin !== undefined && 
        (params.transactionValue === undefined || params.transactionValue < rule.transactionValueMin)) {
      return false;
    }
    if (rule.transactionValueMax !== undefined && 
        (params.transactionValue === undefined || params.transactionValue > rule.transactionValueMax)) {
      return false;
    }

    return true;
  }

  private isProviderHealthy(provider: PaymentProvider): boolean {
    const health = this.providerHealth.get(provider);
    if (!health) return true;
    
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    if (health.lastCheck < tenMinutesAgo) return true;
    
    return health.healthy;
  }

  async checkProviderHealth(provider: PaymentProvider): Promise<boolean> {
    try {
      const impl = this.providers.get(provider);
      if (!impl) return false;

      const config = await impl.getProviderConfig();
      const isHealthy = config.isEnabled;

      this.providerHealth.set(provider, {
        healthy: isHealthy,
        lastCheck: new Date(),
      });

      return isHealthy;
    } catch {
      this.providerHealth.set(provider, {
        healthy: false,
        lastCheck: new Date(),
      });
      return false;
    }
  }

  async healthCheckAll(): Promise<Map<PaymentProvider, boolean>> {
    const results = new Map<PaymentProvider, boolean>();

    for (const provider of this.providers.keys()) {
      const healthy = await this.checkProviderHealth(provider);
      results.set(provider, healthy);
    }

    return results;
  }

  async createCheckout(params: CreateCheckoutParams): Promise<{ provider: PaymentProvider; checkoutUrl: string; sessionId: string }> {
    const selectedProvider = await this.selectProvider({
      countryCode: params.countryCode,
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      planId: params.planId,
    });

    const providerImpl = this.providers.get(selectedProvider);
    if (!providerImpl) {
      throw new Error(`Provider ${selectedProvider} not available`);
    }

    const result = await providerImpl.createCheckoutSession({
      planId: params.planId,
      amount: this.getPlanPrice(params.planId, params.currency),
      currency: params.currency,
      paymentMethod: params.paymentMethod,
      successUrl: params.successUrl,
      cancelUrl: params.cancelUrl,
      metadata: {
        organisation_id: params.organisationId,
        user_id: params.userId || '',
        email: params.email,
      },
    });

    return {
      provider: selectedProvider,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    };
  }

  private getPlanPrice(planId: PlanId, currency: string): number {
    const prices: Record<string, Record<string, number>> = {
      lawyer: { MYR: 89, IDR: 320000, SGD: 129, THB: 3500, PHP: 5500, VND: 2500000 },
      firm_sme: { MYR: 169, IDR: 600000, SGD: 249, THB: 6500, PHP: 10500, VND: 4700000 },
      business: { MYR: 399, IDR: 1400000, SGD: 580, THB: 15000, PHP: 24500, VND: 11000000 },
    };
    return prices[planId]?.[currency] || prices[planId]?.MYR || 0;
  }

  addRoutingRule(rule: Omit<PaymentRoutingRule, 'id' | 'createdAt' | 'updatedAt'>): void {
    this.routingRules.push({
      ...rule,
      id: `rule_${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  setCountryConfig(config: CountryConfig): void {
    this.countryConfigs.set(config.countryCode, config);
  }

  getCountryConfig(countryCode: string): CountryConfig | undefined {
    return this.countryConfigs.get(countryCode);
  }

  private initializeDefaultRoutingRules(): void {
    this.routingRules = [
      { id: 'rule_1', countryCode: 'MY', currency: 'MYR', provider: 'xendit', priority: 1, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'rule_2', countryCode: 'ID', currency: 'IDR', provider: 'xendit', priority: 1, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'rule_3', countryCode: 'SG', currency: 'SGD', provider: 'xendit', priority: 1, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'rule_4', countryCode: 'TH', currency: 'THB', provider: 'xendit', priority: 1, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'rule_5', countryCode: 'PH', currency: 'PHP', provider: 'xendit', priority: 1, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'rule_6', countryCode: 'VN', currency: 'VND', provider: 'xendit', priority: 1, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 'rule_enterprise', customerSegment: 'enterprise', provider: '2c2p', priority: 1, isEnabled: true, createdAt: new Date(), updatedAt: new Date() },
    ];
  }

  private initializeDefaultCountryConfigs(): void {
    const configs: CountryConfig[] = [
      { countryCode: 'MY', countryName: 'Malaysia', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur', defaultPaymentProvider: 'xendit', enabled: true, taxEnabled: true, subscriptionEnabled: true },
      { countryCode: 'ID', countryName: 'Indonesia', currency: 'IDR', timezone: 'Asia/Jakarta', defaultPaymentProvider: 'xendit', enabled: true, taxEnabled: false, subscriptionEnabled: true },
      { countryCode: 'SG', countryName: 'Singapore', currency: 'SGD', timezone: 'Asia/Singapore', defaultPaymentProvider: 'xendit', enabled: true, taxEnabled: false, subscriptionEnabled: true },
      { countryCode: 'TH', countryName: 'Thailand', currency: 'THB', timezone: 'Asia/Bangkok', defaultPaymentProvider: 'xendit', enabled: true, taxEnabled: false, subscriptionEnabled: true },
      { countryCode: 'PH', countryName: 'Philippines', currency: 'PHP', timezone: 'Asia/Manila', defaultPaymentProvider: 'xendit', enabled: true, taxEnabled: false, subscriptionEnabled: true },
      { countryCode: 'VN', countryName: 'Vietnam', currency: 'VND', timezone: 'Asia/Ho_Chi_Minh', defaultPaymentProvider: 'xendit', enabled: true, taxEnabled: false, subscriptionEnabled: true },
    ];

    for (const config of configs) {
      this.countryConfigs.set(config.countryCode, config);
    }
  }
}

interface PaymentRoutingRule {
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

export const paymentOrchestrator = new PaymentOrchestrator();
