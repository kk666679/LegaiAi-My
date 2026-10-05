export const VIDEO_RATES = {
  'seedance-2.5': { perSecond: 0.05 },   // $0.05/s
  'kling-3.0': { perSecond: 0.08 },
  'xiaoyunque': { perSecond: 0.03 },
};

export function estimateVideoCost({ provider, seconds }) {
  const rate = VIDEO_RATES[provider];
  if (!rate) throw new Error(`Unknown video provider: ${provider}`);
  return rate.perSecond * seconds;
}