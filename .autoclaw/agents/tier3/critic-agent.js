"use strict";
/**
 * agents/tier3/critic-agent.js — Tier 3: Critic agent for plan/output review.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { BaseAgent } = require('../base-agent');
const { llm } = require('../../llm');

class CriticAgent extends BaseAgent {
  constructor() {
    super({
      id: 'critic-agent',
      role: 'critic',
      tier: 3,
      capabilities: ['review.plan', 'review.output', 'find.issues'],
      skills: ['validate-output'],
      tools: [],
    });
  }

  async run({ target, artifact, criteria = [] }) {
    const prompt = `
You are a strict critic reviewing an agent's ${artifact.type}.

## Agent
${target}

## Artifact
${JSON.stringify(artifact.content, null, 2)}

## Criteria
${criteria.map((c) => `- ${c}`).join('\n')}

Identify issues, missing steps, and risks. Return JSON:
{"issues": [{"severity":"low|med|high","description":"..."}], "score": 0-1}
`.trim();

    const result = await llm.complete({ prompt, responseFormat: 'json', maxTokens: 500 });
    return typeof result === 'string' ? JSON.parse(result) : result;
  }
}

exports.CriticAgent = CriticAgent;