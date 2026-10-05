"use strict";
/**
 * eval/scorers/index.js — Scorer registry.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { exactMatchScorer } = require('./exact-match');
const { fuzzyMatchScorer } = require('./fuzzy-match');
const { jsonSchemaScorer } = require('./json-schema');
const { toolCallScorer } = require('./tool-call');
const { llmJudgeScorer } = require('./llm-judge');
const { compositeScorer } = require('./composite');

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

exports.scorerRegistry = { register, get, list };