export class CapabilityHandshake {
  constructor({ cards } = {}) {
    this.cards = cards;
  }

  async negotiate(agentCard) {
    const card = await this.cards.get(agentCard.id);
    if (card) {
      agentCard.capabilities = [...new Set([...(card.capabilities ?? []), ...(agentCard.capabilities ?? [])])];
    }
    return { negotiated: true, capabilities: agentCard.capabilities };
  }
}
