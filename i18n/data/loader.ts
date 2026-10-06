// i18n/data/loader.ts
import fs from "node:fs";
import path from "node:path";
import type { Locale } from "../config/locales";

export interface DetectEntry {
  id: string;
  text: string;
  lang: Locale;
  /** Optional metadata for evaluation slicing */
  script?: string;
  domain?: string;
}

let cached: DetectEntry[] | null = null;

/**
 * Parse `i18n/data/detect.jsonl`. Cached after the first read.
 * Server-only (uses fs). For client-side use, import the file as
 * a string and pass it to `parseDetectJsonl`.
 */
export function loadDetectData(): DetectEntry[] {
  if (cached) return cached;
  const file = path.join(process.cwd(), "i18n/data/detect.jsonl");
  const raw = fs.readFileSync(file, "utf8");
  cached = parseDetectJsonl(raw);
  return cached;
}

export function parseDetectJsonl(raw: string): DetectEntry[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      try {
        const obj = JSON.parse(line) as DetectEntry;
        if (!obj.id || !obj.text || !obj.lang) throw new Error("missing fields");
        return obj;
      } catch (e) {
        throw new Error(`Invalid JSONL line: ${line.slice(0, 60)}… (${(e as Error).message})`);
      }
    });
}
