import { judge } from './llm-judge.js';
import { detectRegression } from './regression-detector.js';
import { peerReview } from './peer-review.js';
import { consensus } from './consensus.js';

async function reviewArtifact({ artifact, goal, baseline, reviewers = 3 }) {
  // 1. LLM judge
  const judged = await judge({ goal, artifact });

  // 2. Regression detection
  const regression = await detectRegression({ artifact, baseline });

  // 3. Multi-agent peer review
  const peers = await peerReview({ artifact, reviewers });

  // 4. Consensus
  const verdict = consensus([judged.weighted, ...peers.map((p) => p.score)]);

  return {
    verdict: verdict.score >= 0.75 ? 'approve' : verdict.score >= 0.5 ? 'revise' : 'reject',
    score: verdict.score,
    judged,
    regression,
    peers,
    consensus: verdict,
  };
}

export { reviewArtifact };
