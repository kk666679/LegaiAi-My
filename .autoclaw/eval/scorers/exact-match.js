"use strict";
/**
 * eval/scorers/exact-match.js — Exact match scorer.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const exactMatchScorer = {
  name: 'exact-match',
  async score({ output, expected }) {
    const match = JSON.stringify(output) === JSON.stringify(expected);
    return { scorer: 'exact-match', value: match ? 1 : 0, detail: match ? 'Exact match' : 'Mismatch' };
  },
};

exports.exactMatchScorer = exactMatchScorer;