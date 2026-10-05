"use strict";
/**
 * eval/scorers/fuzzy-match.js — Fuzzy string match scorer.
 */
Object.defineProperty(exports, "__esModule", { value: true });

function similarity(a, b) {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1;
  return (longer.length - editDistance(longer, shorter)) / longer.length;
}

function editDistance(a, b) {
  const dp = Array.from({ length: b.length + 1 }, () => Array(a.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[0][i] = i;
  for (let j = 0; j <= b.length; j++) dp[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      if (b[j - 1] === a[i - 1]) dp[j][i] = dp[j - 1][i - 1];
      else dp[j][i] = 1 + Math.min(dp[j - 1][i], dp[j][i - 1], dp[j - 1][i - 1]);
    }
  }
  return dp[b.length][a.length];
}

const fuzzyMatchScorer = {
  name: 'fuzzy-match',
  async score({ output, expected }) {
    if (typeof output !== 'string' || typeof expected !== 'string') {
      return { scorer: 'fuzzy-match', value: 0, detail: 'Non-string inputs' };
    }
    const value = similarity(output, expected);
    return { scorer: 'fuzzy-match', value, detail: `Similarity: ${(value * 100).toFixed(1)}%` };
  },
};

exports.fuzzyMatchScorer = fuzzyMatchScorer;