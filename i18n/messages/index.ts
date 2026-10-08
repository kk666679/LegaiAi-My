import { DEFAULT_LOCALE, type Locale } from "../config/locales";
import { deepMerge } from "../utils/translation-utils";

// ── English source of truth ────────────────────────────────────
import enAuth from "./en/auth.json";
import enCommon from "./en/common.json";
import enContracts from "./en/contracts.json";
import enDocuments from "./en/documents.json";
import enMatters from "./en/matters.json";

// ── All other locales (merged over English at load time) ───────
import msAuth from "./ms/auth.json"; // Bahasa Malaysia
import msCommon from "./ms/common.json";
import msContracts from "./ms/contracts.json";
import msDocuments from "./ms/documents.json";
import msMatters from "./ms/matters.json";
import idAuth from "./id/auth.json"; // Bahasa Indonesia
import idCommon from "./id/common.json";
import idContracts from "./id/contracts.json";
import idDocuments from "./id/documents.json";
import idMatters from "./id/matters.json";
import thAuth from "./th/auth.json"; // ไทย
import thCommon from "./th/common.json";
import thContracts from "./th/contracts.json";
import thDocuments from "./th/documents.json";
import thMatters from "./th/matters.json";
import viAuth from "./vi/auth.json"; // Tiếng Việt
import viCommon from "./vi/common.json";
import viContracts from "./vi/contracts.json";
import viDocuments from "./vi/documents.json";
import viMatters from "./vi/matters.json";
import tlAuth from "./tl/auth.json"; // Tagalog
import tlCommon from "./tl/common.json";
import tlContracts from "./tl/contracts.json";
import tlDocuments from "./tl/documents.json";
import tlMatters from "./tl/matters.json";
import kmAuth from "./km/auth.json"; // ខ្មែរ
import kmCommon from "./km/common.json";
import kmContracts from "./km/contracts.json";
import kmDocuments from "./km/documents.json";
import kmMatters from "./km/matters.json";
import loAuth from "./lo/auth.json"; // ລາວ
import loCommon from "./lo/common.json";
import loContracts from "./lo/contracts.json";
import loDocuments from "./lo/documents.json";
import loMatters from "./lo/matters.json";
import myAuth from "./my/auth.json"; // မြန်မာ
import myCommon from "./my/common.json";
import myContracts from "./my/contracts.json";
import myDocuments from "./my/documents.json";
import myMatters from "./my/matters.json";
import bnAuth from "./bn/auth.json"; // বাংলা
import bnCommon from "./bn/common.json";
import bnContracts from "./bn/contracts.json";
import bnDocuments from "./bn/documents.json";
import bnMatters from "./bn/matters.json";
import jvAuth from "./jv/auth.json"; // Basa Jawa
import jvCommon from "./jv/common.json";
import jvContracts from "./jv/contracts.json";
import jvDocuments from "./jv/documents.json";
import jvMatters from "./jv/matters.json";

// Cast JSON imports — TS infers narrow literal types otherwise.
type Tree = Record<string, unknown>;
const en = enAuth as unknown as Tree;

const merge = (override: Tree) => deepMerge(en, override);
const j = (v: unknown) => v as unknown as Tree;

const EN_NS = [enCommon, enContracts, enDocuments, enMatters] as const;
const NS_KEYS = ["common", "contracts", "documents", "matters"] as const;

/**
 * Merge one locale's per-namespace files over English.
 * Each namespace file contributes its top-level key (e.g. contracts.json
 * provides `contracts.*`); auth.json provides the legacy flat keys.
 * Missing namespace files fall through to English (ms is fully
 * translated; others ship English stubs that merge cleanly).
 */
function buildLocale(auth: Tree, ns: Tree[]): Tree {
  const out = deepMerge(enAuth as unknown as Record<string, unknown>, auth);
  for (let i = 0; i < NS_KEYS.length; i += 1) {
    const overlay = (ns[i] ?? {}) as Record<string, unknown>;
    (out as Record<string, unknown>)[NS_KEYS[i]!] = deepMerge(
      EN_NS[i] as Record<string, unknown>,
      overlay,
    );
  }
  return out;
}

/**
 * Every locale's full message tree.
 * Non-English locales are deep-merged over English so any missing
 * key silently falls through to the English string — no runtime gaps.
 */
export const BUNDLES: Record<Locale, Tree> = {
  en: buildLocale(en, [j(enCommon), j(enContracts), j(enDocuments), j(enMatters)]),
  ms: buildLocale(j(msAuth), [j(msCommon), j(msContracts), j(msDocuments), j(msMatters)]),
  id: buildLocale(j(idAuth), [j(idCommon), j(idContracts), j(idDocuments), j(idMatters)]),
  th: buildLocale(j(thAuth), [j(thCommon), j(thContracts), j(thDocuments), j(thMatters)]),
  vi: buildLocale(j(viAuth), [j(viCommon), j(viContracts), j(viDocuments), j(viMatters)]),
  tl: buildLocale(j(tlAuth), [j(tlCommon), j(tlContracts), j(tlDocuments), j(tlMatters)]),
  km: buildLocale(j(kmAuth), [j(kmCommon), j(kmContracts), j(kmDocuments), j(kmMatters)]),
  lo: buildLocale(j(loAuth), [j(loCommon), j(loContracts), j(loDocuments), j(loMatters)]),
  my: buildLocale(j(myAuth), [j(myCommon), j(myContracts), j(myDocuments), j(myMatters)]),
  bn: buildLocale(j(bnAuth), [j(bnCommon), j(bnContracts), j(bnDocuments), j(bnMatters)]),
  jv: buildLocale(j(jvAuth), [j(jvCommon), j(jvContracts), j(jvDocuments), j(jvMatters)]),
};

/** Load a locale's full message tree. Falls through to English. */
export function loadMessages(locale: Locale): Record<string, unknown> {
  return BUNDLES[locale] ?? BUNDLES[DEFAULT_LOCALE];
}

/** Raw English dictionary — used as the fallback in the provider. */
export function getFallbackMessages(): Record<string, unknown> {
  return BUNDLES[DEFAULT_LOCALE];
}

/** All locales that currently have a message bundle. */
export function availableLocales(): Locale[] {
  return Object.keys(BUNDLES) as Locale[];
}
