'use strict';

/**
 * patterns — recurring structure across insights.
 *
 * A pattern is a tag carried by at least `minOccurrences` insights, described
 * by its most recent carrier. No tag means no pattern: a single occurrence is
 * an anecdote, and promoting it to "recurring" would be a lie in the memory file.
 */

/** tag -> insights, filtered by excludeTags. */
function detectPatterns(insights = [], { minOccurrences = 3, excludeTags = ['draft'] } = {}) {
  const byTag = new Map();
  for (const ins of insights) {
    const tags = ins.front && Array.isArray(ins.front.tags) ? ins.front.tags : [];
    // Exclusion is insight-level: an insight carrying a `draft` tag is not
    // evidence of anything, so none of its tags count toward recurrence.
    if (tags.some(t => excludeTags.includes(t))) continue;
    for (const t of tags) {
      if (!byTag.has(t)) byTag.set(t, []);
      byTag.get(t).push(ins);
    }
  }

  const patterns = {};
  for (const [tag, list] of byTag) {
    if (list.length < minOccurrences) continue;
    const latest = list[list.length - 1];
    patterns[tag] = [
      `Seen in ${list.length} insights (latest: \`${latest.file}\`).`,
      latest.title
    ];
  }
  return patterns;
}

/** Promoted insights first, then newest filename — the retention order. */
function rankInsights(insights = []) {
  return [...insights].sort((a, b) => {
    const ap = a.front && a.front.promoted ? 1 : 0;
    const bp = b.front && b.front.promoted ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return String(b.file).localeCompare(String(a.file));
  });
}

module.exports = { detectPatterns, rankInsights };