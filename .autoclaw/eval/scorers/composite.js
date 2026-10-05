"use strict";
/**
 * eval/scorers/composite.js — Composite scorer combining multiple scorers.
 */
Object.defineProperty(exports, "__esModule", { value: true });

function compositeScorer({ scorers, weights }) {
  return {
    name: 'composite',
    async score(context) {
      const scores = await Promise.all(scorers.map((s) => s.score(context)));
      const value = scores.reduce((sum, s, i) => sum + s.value * (weights[i] ?? 1), 0) /
                    weights.reduce((a, b) => a + b, 0);
      return { scorer: 'composite', value, detail: scores.map((s) => `${s.scorer}:${s.value.toFixed(2)}`).join(', ') };
    },
  };
}

exports.compositeScorer = compositeScorer;