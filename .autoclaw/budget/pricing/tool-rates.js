export const TOOL_RATES = {
  'vector.hybrid_search': { perCall: 0.0001 },
  'kg.query_entity': { perCall: 0.0002 },
  'device.reboot': { perCall: 0.00 },
  'video.generate': { perSecond: 0.05 },
};

export function estimateToolCost({ tool, duration = 1 }) {
  const rate = TOOL_RATES[tool];
  if (!rate) throw new Error(`Unknown tool: ${tool}`);
  return rate.perCall * duration;
}