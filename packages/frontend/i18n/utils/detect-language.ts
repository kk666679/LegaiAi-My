// i18n/utils/detect-language.ts
import { locales, type Locale } from "../config/locales";
import { LANGUAGE_MARKERS } from "../data/language-markers";

/**
 * Unicode script ranges — decisive per script.
 */
const SCRIPT_PATTERNS: Array<{ locale: Locale; re: RegExp }> = [
  { locale: "th", re: /[\u0E00-\u0E7F]/ },
  { locale: "lo", re: /[\u0E80-\u0EFF]/ },
  { locale: "km", re: /[\u1780-\u17FF]/ },
  { locale: "my", re: /[\u1000-\u109F]/ },
  { locale: "bn", re: /[\u0980-\u09FF]/ },
];

/**
 * Vietnamese diacritics. Presence of any is decisive over the
 * Latin-script Latin languages.
 */
const VIETNAMESE_MARKERS =
  /[ăâđêôơưĂÂĐÊÔƠƯ]|[àáảãạằắẳẵặầấẩẫậèéẻẽẹềếểễệìíỉĩịòóỏõọồốổỗộờớởỡợùúủũụừứửữựỳýỷỹỵ]/i;

/**
 * Minimum score for the winner to be accepted.
 * Below this threshold the detector returns the fallback.
 */
const MIN_SCORE = 0.5;

/**
 * Decisive-token threshold. A marker with weight >= this counts as
 * a decisive match and boosts confidence.
 */
const DECISIVE_WEIGHT = 5;

export interface DetectTextOptions {
  text: string;
  candidates?: Locale[];
  fallback?: Locale;
  minScore?: number;
}

export interface DetectTextResult {
  locale: Locale;
  confidence: number;
  scores: Record<Locale, number>;
  /** Highest single-marker weight matched for the winning locale */
  decisiveWeight: number;
  method: "script" | "diacritics" | "markers" | "fallback";
}

export function detectLocaleFromText(options: DetectTextOptions): DetectTextResult {
  const {
    text,
    candidates = locales,
    fallback = "en",
    minScore = MIN_SCORE,
  } = options;

  const scores = Object.fromEntries(locales.map((l) => [l, 0])) as Record<Locale, number>;
  const decisive = Object.fromEntries(locales.map((l) => [l, 0])) as Record<Locale, number>;

  if (!text || !text.trim()) {
    return { locale: fallback, confidence: 0, scores, decisiveWeight: 0, method: "fallback" };
  }

  // ── 1. Script detection ───────────────────────────────
  for (const { locale, re } of SCRIPT_PATTERNS) {
    if (!candidates.includes(locale)) continue;
    const matches = text.match(new RegExp(re.source, "g"));
    if (matches && matches.length > 0) {
      scores[locale] = matches.length;
      return {
        locale,
        confidence: Math.min(0.99, 0.75 + matches.length * 0.02),
        scores,
        decisiveWeight: 10,
        method: "script",
      };
    }
  }

  // ── 2. Vietnamese diacritics ──────────────────────────
  if (candidates.includes("vi") && VIETNAMESE_MARKERS.test(text)) {
    const matches = text.match(new RegExp(VIETNAMESE_MARKERS.source, "gi")) ?? [];
    scores.vi = matches.length;
    return {
      locale: "vi",
      confidence: Math.min(0.95, 0.7 + matches.length * 0.03),
      scores,
      decisiveWeight: 10,
      method: "diacritics",
    };
  }

  // ── 3. Marker scoring ─────────────────────────────────
  // Build two token sets: plain (no hyphens) and hyphen-preserving.
  const lower = text.toLowerCase();
  const plainTokens = lower.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const hyphenTokens = lower.split(/[^\p{L}\p{N}-]+/u).filter(Boolean);

  const plainSet = new Set(plainTokens);
  const hyphenSet = new Set(hyphenTokens);

  // Bigrams from plain tokens
  const bigrams = new Set<string>();
  for (let i = 0; i < plainTokens.length - 1; i++) {
    bigrams.add(`${plainTokens[i]} ${plainTokens[i + 1]}`);
  }

  const hasTerm = (term: string): boolean => {
    if (term.includes(" ")) return bigrams.has(term);
    return plainSet.has(term) || hyphenSet.has(term);
  };

  for (const locale of candidates) {
    const markers = LANGUAGE_MARKERS[locale];
    if (!markers) continue;
    for (const { term, weight } of markers) {
      if (hasTerm(term)) {
        scores[locale] += weight;
        if (weight > decisive[locale]) decisive[locale] = weight;
      }
    }
  }

  // ── 4. Pick the winner ────────────────────────────────
  const ranked = (Object.entries(scores) as Array<[Locale, number]>)
    .filter(([l]) => candidates.includes(l))
    // primary: score desc
    // secondary: decisive marker presence desc
    // tertiary: keep config order (stable)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return decisive[b[0]] - decisive[a[0]];
    });

  const [winner, topScore] = ranked[0] ?? [fallback, 0];
  const runnerUpScore = ranked[1]?.[1] ?? 0;
  const runnerUpLocale = ranked[1]?.[0];

  if (topScore < minScore) {
    return { locale: fallback, confidence: 0, scores, decisiveWeight: 0, method: "fallback" };
  }

  // Confidence formula — margin + score + decisive-token bonus
  const margin = topScore - runnerUpScore;
  const marginFactor = topScore > 0 ? margin / topScore : 0;
  const scoreFactor = Math.min(1, topScore / 10);
  const decisiveBonus = decisive[winner] >= DECISIVE_WEIGHT ? 0.1 : 0;

  // If we were forced to break a tie by decisive-token presence alone
  // (equal scores), cap confidence lower so callers know it was close.
  const tied = runnerUpLocale !== undefined && topScore === runnerUpScore;
  const tieConfidenceCap = tied ? 0.7 : 1;

  const confidence = Math.min(
    tieConfidenceCap,
    0.35 + marginFactor * 0.35 + scoreFactor * 0.2 + decisiveBonus,
  );

  return {
    locale: winner,
    confidence,
    scores,
    decisiveWeight: decisive[winner],
    method: "markers",
  };
}
