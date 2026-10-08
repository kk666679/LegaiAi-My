#!/usr/bin/env node
/**
 * eval-detect — language-detection accuracy harness for the .autoclaw
 * EN/MS catalogue detector (`.autoclaw/i18n/index.js`).
 *
 * Usage:
 *   node scripts/eval-detect.mjs              # accuracy summary
 *   node scripts/eval-detect.mjs --confusion  # confusion matrix
 *   node scripts/eval-detect.mjs --failures   # list misclassified cases
 *
 * Exit code is 1 when any case fails, so it can gate CI.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { detect } from "../.autoclaw/i18n/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const fixturesPath = join(here, "fixtures", "detect-cases.json");

let fixtures;
try {
  fixtures = JSON.parse(readFileSync(fixturesPath, "utf8"));
} catch (err) {
  console.error(`eval-detect: cannot read fixtures at ${fixturesPath}`);
  console.error("Create it with [{ text, expected }] entries (expected: 'en' | 'ms').");
  process.exit(2);
}

const args = new Set(process.argv.slice(2));
const showConfusion = args.has("--confusion");
const showFailures = args.has("--failures");

let pass = 0;
const failures = [];
const matrix = new Map(); // `${expected}->${actual}` → count

for (const { text, expected } of fixtures) {
  const actual = detect(text ?? "");
  const key = `${expected}->${actual}`;
  matrix.set(key, (matrix.get(key) ?? 0) + 1);
  if (actual === expected) {
    pass += 1;
  } else {
    failures.push({ text: String(text ?? "").slice(0, 80), expected, actual });
  }
}

const total = fixtures.length;
const failed = total - pass;
const acc = total === 0 ? 0 : ((pass / total) * 100).toFixed(1);
console.log(`eval-detect: ${pass}/${total} passed (${acc}%)`);

if (showConfusion && matrix.size > 0) {
  console.log("\nconfusion (expected->actual: count):");
  for (const [k, v] of [...matrix.entries()].sort()) console.log(`  ${k}: ${v}`);
}

if ((showFailures || failed > 0) && failures.length > 0) {
  console.log("\nfailures:");
  for (const f of failures) {
    console.log(`  ✗ expected=${f.expected} actual=${f.actual} — "${f.text}…"`);
  }
}

process.exit(failed === 0 ? 0 : 1);
