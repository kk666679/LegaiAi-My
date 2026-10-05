"use strict";
/**
 * eval/replay.js — Deterministic replay of eval traces with divergence detection.
 *
 * Replay divergence is a critical metric: the same event producing different
 * downstream events when the LLM consumer changes indicates non-determinism
 * that must be tracked for production reliability.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const { evalTracer } = require('./traces/store');

async function replay({ traceId, mockLLM = true, detectDivergence = true, mockFn = null }) {
  const trace = await evalTracer.load(traceId);
  const recordedOutputs = new Map(
    trace.events
      .filter((e) => e.type === 'tool_call' || e.type === 'llm_call')
      .map((e) => [JSON.stringify(e.data.input), e.data.output])
  );

  // Simple mock function that returns recorded output for matching input
  const mock = mockLLM
    ? (prompt) => recordedOutputs.get(JSON.stringify(prompt))
    : mockFn;

  try {
    const { agentRegistry } = require('../../agents/registry');
    const agent = agentRegistry.get(trace.agentId);
    if (!agent) throw new Error(`Agent ${trace.agentId} not found`);

    // If agent has a setMock method, use it
    let clearMock = null;
    if (mock && typeof agent.setMock === 'function') {
      clearMock = agent.setMock(mock);
    }

    try {
      const result = await agent.run(trace.goal, trace.context);

      let divergence = null;
      if (detectDivergence) {
        divergence = detectDivergence(trace.events, result.trace ?? []);
      }

      return { traceId, replayed: true, result, divergence };
    } finally {
      if (clearMock) clearMock();
    }
  } finally {
    // Cleanup
  }
}

function detectDivergence(originalEvents, replayedEvents) {
  const divergences = [];

  // Compare event sequences
  const minLen = Math.min(originalEvents.length, replayedEvents.length);
  for (let i = 0; i < minLen; i++) {
    const orig = originalEvents[i];
    const replay = replayedEvents[i];

    if (orig.type !== replay.type) {
      divergences.push({
        index: i,
        type: 'type_mismatch',
        original: orig.type,
        replayed: replay.type,
        severity: 'high',
      });
      continue;
    }

    // Compare tool calls
    if (orig.type === 'tool_call' && replay.type === 'tool_call') {
      const toolDiff = diffToolCalls(orig.data, replay.data);
      if (toolDiff) {
        divergences.push({
          index: i,
          type: 'tool_call_divergence',
          ...toolDiff,
          severity: 'medium',
        });
      }
    }

    // Compare LLM calls
    if (orig.type === 'llm_call' && replay.type === 'llm_call') {
      const promptDiff = diffPrompts(orig.data.input, replay.data.input);
      if (promptDiff) {
        divergences.push({
          index: i,
          type: 'prompt_divergence',
          similarity: promptDiff.similarity,
          severity: promptDiff.similarity < 0.9 ? 'high' : 'low',
        });
      }
    }
  }

  // Check for length mismatch
  if (originalEvents.length !== replayedEvents.length) {
    divergences.push({
      type: 'length_mismatch',
      originalLength: originalEvents.length,
      replayedLength: replayedEvents.length,
      severity: 'high',
    });
  }

  return {
    diverged: divergences.length > 0,
    count: divergences.length,
    divergences,
    severity: divergences.some(d => d.severity === 'high') ? 'high' :
              divergences.some(d => d.severity === 'medium') ? 'medium' : 'low',
  };
}

function diffToolCalls(orig, replay) {
  if (orig.tool !== replay.tool) {
    return { originalTool: orig.tool, replayedTool: replay.tool };
  }
  if (JSON.stringify(orig.input) !== JSON.stringify(replay.input)) {
    return { tool: orig.tool, inputDiverged: true };
  }
  return null;
}

function diffPrompts(orig, replay) {
  const origStr = JSON.stringify(orig);
  const replayStr = JSON.stringify(replay);
  if (origStr === replayStr) return { similarity: 1.0 };

  // Simple token overlap similarity
  const origTokens = new Set(origStr.toLowerCase().match(/\w+/g) ?? []);
  const replayTokens = new Set(replayStr.toLowerCase().match(/\w+/g) ?? []);
  const intersection = [...origTokens].filter(t => replayTokens.has(t)).length;
  const union = new Set([...origTokens, ...replayTokens]).size;
  return { similarity: union > 0 ? intersection / union : 0 };
}

exports.replay = replay;
exports.detectDivergence = detectDivergence;