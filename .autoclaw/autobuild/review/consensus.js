/**
 * Consensus — aggregate scores from multiple reviewers using
 * weighted averaging and outlier rejection.
 */
function consensus(scores) {
  if (!scores.length) {
    return { score: 0, feedback: 'No reviews available' };
  }

  // Filter valid scores
  const validScores = scores.filter((s) => typeof s === 'number' && s >= 0 && s <= 1);
  if (!validScores.length) {
    return { score: 0, feedback: 'No valid scores' };
  }

  // Remove outliers (scores beyond 2 std devs)
  const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
  const stdDev = Math.sqrt(
    validScores.reduce((a, b) => a + (b - mean) ** 2, 0) / validScores.length
  );
  const filtered = validScores.filter((s) => Math.abs(s - mean) <= 2 * stdDev);

  // Weighted average (higher weight to primary judge)
  const primaryWeight = 0.5;
  const peerWeight = 0.5 / filtered.length;
  let weightedScore = 0;

  if (scores[0] !== undefined) {
    weightedScore += scores[0] * primaryWeight;
  }
  for (let i = 1; i < filtered.length; i++) {
    weightedScore += filtered[i] * peerWeight;
  }

  const feedback = generateFeedback(filtered, weightedScore);

  return { score: weightedScore, feedback, mean, stdDev, count: filtered.length };
}

function generateFeedback(scores, weighted) {
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  if (weighted >= 0.75) return 'Strong consensus for approval';
  if (weighted >= 0.5) return 'Conditional approval — minor revisions needed';
  return 'Consensus for rejection — significant issues identified';
}

export { consensus };
