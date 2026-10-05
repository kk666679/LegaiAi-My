import { embed } from '../../intelligence/embed.js';
import { cosineSimilarity } from '../../intelligence/cosine-similarity.js';

export class SemanticRouter {
  constructor({ cards } = {}) {
    this.cards = cards;
    this.agentEmbeddings = new Map();
  }

  async index(agentCard) {
    const capText = (agentCard.capabilities ?? []).join(' ');
    const descText = agentCard.description ?? '';
    this.agentEmbeddings.set(agentCard.id, {
      capabilities: await embed(capText),
      description: await embed(descText),
    });
  }

  async deindex(agentId) {
    this.agentEmbeddings.delete(agentId);
  }

  async match({ task, context, constraints = {} }) {
    const taskEmb = await embed(task.goal);
    const candidates = [];

    for (const [agentId, embeddings] of this.agentEmbeddings) {
      const capSim = cosineSimilarity(taskEmb, embeddings.capabilities);
      const descSim = cosineSimilarity(taskEmb, embeddings.description);
      const semanticScore = ((capSim ?? 0) * 0.7 + (descSim ?? 0) * 0.3);

      const card = await this.cards.get(agentId);
      if (!this.passesConstraints(card, constraints)) continue;

      if (semanticScore > 0.3) {
        candidates.push({ agentId, semanticScore });
      }
    }

    return candidates.sort((a, b) => (b.semanticScore ?? 0) - (a.semanticScore ?? 0));
  }

  passesConstraints(card, constraints) {
    if (constraints.tier && card.tier !== constraints.tier) return false;
    if (constraints.requiredCapabilities) {
      const missing = constraints.requiredCapabilities.filter(
        (c) => !(card.capabilities ?? []).includes(c)
      );
      if (missing.length > 0) return false;
    }
    if (constraints.excludedAgents?.includes(card.id)) return false;
    return true;
  }
}
