export class AgentSubscriptions {
  constructor({ agentId, bus }) {
    this.agentId = agentId;
    this.bus = bus;
    this.subscriptions = new Map();
    this.topics = [];
  }

  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }

    this.subscriptions.get(topic).push(handler);
    this.topics.push(topic);

    // Subscribe to bus
    const unsub = this.bus.subscribe(topic, async (message) => {
      for (const h of this.subscriptions.get(topic) ?? []) {
        try {
          await h(message);
        } catch (error) {
          console.error(`[comms] Handler error for ${this.agentId} on ${topic}:`, error);
        }
      }
    });

    return unsub;
  }

  subscribeMany(topics, handler) {
    const unsubs = [];
    for (const topic of topics) {
      unsubs.push(this.subscribe(topic, handler));
    }
    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }

  subscribePattern(pattern, handler) {
    return this.bus.subscribePattern(pattern, async (message) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`[comms] Pattern handler error for ${this.agentId}:`, error);
      }
    });
  }

  unsubscribeAll() {
    this.subscriptions.clear();
    this.topics = [];
  }

  getSubscriptionCount() {
    let total = 0;
    for (const handlers of this.subscriptions.values()) {
      total += handlers.length;
    }
    return total;
  }

  getTopics() {
    return [...new Set(this.topics)];
  }
}
