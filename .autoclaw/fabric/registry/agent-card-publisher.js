export class AgentCardPublisher {
  constructor({ cards } = {}) {
    this.cards = cards;
  }

  publish(agentCard) {
    return this.cards.save(agentCard);
  }

  revoke(agentId) {
    return this.cards.remove(agentId);
  }
}
