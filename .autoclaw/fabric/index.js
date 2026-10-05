import { CardStore } from './registry/card-store.js';
import { SemanticRouter } from './routing/semantic-router.js';
import { Bus } from './bus/bus.js';
import { PolicyEngine } from './governance/policy-engine.js';
import { RateLimiter } from './governance/rate-limiter.js';
import { CapabilityHandshake } from './onboarding/capability-handshake.js';
import { ReputationStore } from './reputation/reputation-store.js';
import { fabricTracer } from './observability/tracer.js';
import { fabricMetrics } from './observability/metrics.js';

export class Fabric {
  constructor({ config = {} } = {}) {
    this.cards = new CardStore({ path: config.cardsPath ?? '.autoclaw/fabric/cards' });
    this.router = new SemanticRouter({ cards: this.cards });
    this.bus = new Bus({ maxQueue: config.maxQueue ?? 10000 });
    this.policy = new PolicyEngine({ rules: config.policyRules ?? [] });
    this.rateLimiter = new RateLimiter({ defaultLimit: config.rateLimit ?? 100 });
    this.handshake = new CapabilityHandshake({ cards: this.cards });
    this.reputation = new ReputationStore({ path: config.reputationPath ?? '.autoclaw/fabric/reputation' });
  }

  async register(agentCard) {
    return fabricTracer.startSpan('fabric.register', async (span) => {
      span.setAttribute('agent.id', agentCard.id);
      span.setAttribute('agent.capabilities', (agentCard.capabilities ?? []).join(','));

      await this.handshake.negotiate(agentCard);
      await this.cards.save(agentCard);
      await this.router.index(agentCard);

      fabricMetrics.increment('fabric.agents.registered', { tier: agentCard.tier });
      return { registered: true };
    });
  }

  async unregister(agentId) {
    await this.cards.remove(agentId);
    await this.router.deindex(agentId);
    fabricMetrics.increment('fabric.agents.unregistered');
    return { unregistered: true };
  }

  async dispatch({ task, requestingAgent, context = {}, constraints = {} }) {
    return fabricTracer.startSpan('fabric.dispatch', async (span) => {
      span.setAttribute('task.goal', task.goal);
      span.setAttribute('task.requesting_agent', requestingAgent);

      const policyResult = await this.policy.check({ task, requestingAgent, context });
      if (!policyResult.allowed) {
        span.setAttribute('task.denied', policyResult.reason);
        throw new Error(`Policy denied: ${policyResult.reason}`);
      }

      await this.rateLimiter.check(requestingAgent);

      const candidates = await this.router.match({
        task,
        context,
        constraints,
      });
      span.setAttribute('task.candidates', candidates.length);

      if (candidates.length === 0) {
        throw new Error('No capable agent found');
      }

      const selected = await this.selectBest(candidates, { task, context });
      span.setAttribute('task.selected_agent', selected.agentId);

      if (await this.bus.isCircuitOpen(selected.agentId)) {
        span.setAttribute('task.circuit_open', true);
        throw new Error(`Circuit open for agent ${selected.agentId}`);
      }

      const result = await this.bus.request({
        to: selected.agentId,
        from: requestingAgent,
        type: 'task',
        payload: { task, context },
      });

      await this.reputation.record({
        agentId: selected.agentId,
        outcome: result.status === 'ok' ? 'success' : 'failure',
      });

      return result;
    });
  }

  async selectBest(candidates, { task, context }) {
    const scored = await Promise.all(candidates.map(async (c) => ({
      ...c,
      reputation: await this.reputation.score(c.agentId),
      load: await this.bus.queueDepth(c.agentId),
    })));

    return scored.sort((a, b) => {
      const scoreA = (a.semanticScore ?? 0) * 0.5 + a.reputation * 0.3 - (a.load ?? 0) * 0.2;
      const scoreB = (b.semanticScore ?? 0) * 0.5 + b.reputation * 0.3 - (b.load ?? 0) * 0.2;
      return scoreB - scoreA;
    })[0];
  }

  async health() {
    return {
      agents: await this.cards.count(),
      queueDepth: this.bus.queueDepth(),
      openCircuits: this.bus.openCircuitCount(),
      avgReputation: await this.reputation.average(),
    };
  }
}
