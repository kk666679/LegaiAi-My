import { llm } from '../../llm.js';

/**
 * eval/scorers/llm-judge.js — LLM-based judge scorer.
 */
Object.defineProperty(exports, "__esModule", { value: true });

const llmJudgeScorer = {
  name: 'llm-judge',
  async score({ input, output, expected, testCase }) {
    const rubric = testCase.rubric ?? 'Rate the output quality on a scale of 0 to 1.';
    const prompt = `
You are an evaluation judge. Score the following output.

## Task
${input}

## Expected Behavior
${JSON.stringify(expected)}

## Actual Output
${JSON.stringify(output)}

## Rubric
${rubric}

Respond with JSON: {"score": <0-1>, "reasoning": "<explanation>"}
`.trim();

    const result = await llm.complete({ prompt, responseFormat: 'json', maxTokens: 300 });
    const parsed = typeof result === 'string' ? JSON.parse(result) : result;
    return {
      scorer: 'llm-judge',
      value: parsed.score ?? 0,
      detail: parsed.reasoning ?? '',
    };
  }
};

export { llmJudgeScorer as llmJudgeScorer };
