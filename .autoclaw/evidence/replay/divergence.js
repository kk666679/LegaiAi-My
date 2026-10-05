export class DivergenceDetector {
  detect(baseline, replay) {
    const diffs = [];
    const maxLen = Math.max(baseline.length, replay.length);
    for (let i = 0; i < maxLen; i++) {
      if (JSON.stringify(baseline[i]) !== JSON.stringify(replay[i])) {
        diffs.push({ index: i, baseline: baseline[i], replay: replay[i] });
      }
    }
    return { diverged: diffs.length > 0, diffs };
  }
}
