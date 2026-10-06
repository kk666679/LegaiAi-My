import { exactMatchScorer } from './exact-match.js';
import { fuzzyMatchScorer } from './fuzzy-match.js';
import { jsonSchemaScorer } from './json-schema.js';
import { toolCallScorer } from './tool-call.js';
import { llmJudgeScorer } from './llm-judge.js';
import { compositeScorer } from './composite.js';

/**
 * eval/scorers/index.js — Scorer registry.
 */


const scorerRegistry = new Map([
  ['exact-match', exactMatchScorer],
  ['fuzzy-match', fuzzyMatchScorer],
  ['json-schema', jsonSchemaScorer],
  ['tool-call', toolCallScorer],
  ['llm-judge', llmJudgeScorer],
  ['composite', compositeScorer],
]);

function register(name, scorer) {
  scorerRegistry.set(name, scorer);
}

function get(name) {
  return scorerRegistry.get(name);
}

function list() {
  return [...scorerRegistry.keys()];
}

scorerRegistry = { register, get, list };
