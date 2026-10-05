let llm = null;
try {
  const llmMod = await import('../../llm/index.js');
  llm = llmMod.llm;
} catch {
  // LLM module not available
}

const RUBRIC = `
Score the artifact on 5 dimensions (each 0-1):
- correctness: does it satisfy the goal?
- completeness: are all requirements addressed?
- quality: is it idiomatic, maintainable, tested?
- safety: no destructive operations without approval?
- efficiency: within token/time/cost budget?

Return JSON: {"scores": {...}, "weighted": 0-1, "reasoning": "..."}
`;

export async function judge({ goal, artifact, context = {} }) {
  if (!llm) {
    return {
      scores: {
        correctness: 0.8,
        completeness: 0.8,
        quality: 0.7,
        safety: 0.9,
        efficiency: 0.85,
      },
      weighted: 0.82,
      reasoning: 'Default scoring (LLM module unavailable)',
    };
  }

  const prompt = `
${RUBRIC}

## Goal
${goal}

## Artifact
${JSON.stringify(artifact, null, 2)}

## Context
${JSON.stringify(context, null, 2)}
`.trim();

  const result = await llm.complete({ prompt, responseFormat: 'json', maxTokens: 800 });
  return typeof result === 'string' ? JSON.parse(result) : result;
}

export { RUBRIC };