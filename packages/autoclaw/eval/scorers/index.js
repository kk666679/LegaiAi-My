import { exactMatchScorer } from './exact-match.js';
import { fuzzyMatchScorer } from './fuzzy-match.js';
import { jsonSchemaScorer } from './json-schema.js';
import { toolCallScorer } from './tool-call.js';
import { llmJudgeScorer } from './llm-judge.js';
import { compositeScorer } from './composite.js';

/**
 * eval/scorers/index.js — Scorer registry.
 */


const registryMap = new Map([
  ['exact-match', exactMatchScorer],
  ['fuzzy-match', fuzzyMatchScorer],
  ['json-schema', jsonSchemaScorer],
  ['tool-call', toolCallScorer],
  ['llm-judge', llmJudgeScorer],
  ['composite', compositeScorer],
]);

const scorerRegistry = {
  register(name, scorer) {
    registryMap.set(name, scorer);
  },
  get(name) {
    return registryMap.get(name);
  },
  list() {
    return [...registryMap.keys()];
  },
};

export { scorerRegistry, registryMap };
