import { DEFAULT_LOCALE, type Locale } from "../config/locales";
import { deepMerge } from "../utils/translation-utils";

// ─────────────────────────────────────────────────────────────
// Generated from i18n/messages/<locale>/<namespace>.json —
// every namespace for every locale, statically imported so the
// bundles are resolvable at build time (no runtime fs access).
// ─────────────────────────────────────────────────────────────

type Tree = Record<string, unknown>;

// ── English source of truth ─────────────────────────────────
import enAnalysis from "./en/analysis.json";
import enAuth from "./en/auth.json";
import enAutomation from "./en/automation.json";
import enByok from "./en/byok.json";
import enCommon from "./en/common.json";
import enContracts from "./en/contracts.json";
import enDashboard from "./en/dashboard.json";
import enDisclaimer from "./en/disclaimer.json";
import enDocuments from "./en/documents.json";
import enGovernance from "./en/governance.json";
import enHitl from "./en/hitl.json";
import enMatters from "./en/matters.json";
import enNav from "./en/nav.json";
import enSettings from "./en/settings.json";
import enSidebar from "./en/sidebar.json";
import enTopbar from "./en/topbar.json";
import enUsers from "./en/users.json";

const EN: Record<string, Tree> = {
  analysis: enAnalysis as unknown as Tree,
  auth: enAuth as unknown as Tree,
  automation: enAutomation as unknown as Tree,
  byok: enByok as unknown as Tree,
  common: enCommon as unknown as Tree,
  contracts: enContracts as unknown as Tree,
  dashboard: enDashboard as unknown as Tree,
  disclaimer: enDisclaimer as unknown as Tree,
  documents: enDocuments as unknown as Tree,
  governance: enGovernance as unknown as Tree,
  hitl: enHitl as unknown as Tree,
  matters: enMatters as unknown as Tree,
  nav: enNav as unknown as Tree,
  settings: enSettings as unknown as Tree,
  sidebar: enSidebar as unknown as Tree,
  topbar: enTopbar as unknown as Tree,
  users: enUsers as unknown as Tree,
};

// ── ms — merged over English at load time ──────────
import msAnalysis from "./ms/analysis.json";
import msAuth from "./ms/auth.json";
import msAutomation from "./ms/automation.json";
import msByok from "./ms/byok.json";
import msCommon from "./ms/common.json";
import msContracts from "./ms/contracts.json";
import msDashboard from "./ms/dashboard.json";
import msDisclaimer from "./ms/disclaimer.json";
import msDocuments from "./ms/documents.json";
import msGovernance from "./ms/governance.json";
import msHitl from "./ms/hitl.json";
import msMatters from "./ms/matters.json";
import msNav from "./ms/nav.json";
import msSettings from "./ms/settings.json";
import msSidebar from "./ms/sidebar.json";
import msTopbar from "./ms/topbar.json";
import msUsers from "./ms/users.json";

const MS: Record<string, Tree> = {
  analysis: msAnalysis as unknown as Tree,
  auth: msAuth as unknown as Tree,
  automation: msAutomation as unknown as Tree,
  byok: msByok as unknown as Tree,
  common: msCommon as unknown as Tree,
  contracts: msContracts as unknown as Tree,
  dashboard: msDashboard as unknown as Tree,
  disclaimer: msDisclaimer as unknown as Tree,
  documents: msDocuments as unknown as Tree,
  governance: msGovernance as unknown as Tree,
  hitl: msHitl as unknown as Tree,
  matters: msMatters as unknown as Tree,
  nav: msNav as unknown as Tree,
  settings: msSettings as unknown as Tree,
  sidebar: msSidebar as unknown as Tree,
  topbar: msTopbar as unknown as Tree,
  users: msUsers as unknown as Tree,
};

// ── id — merged over English at load time ──────────
import idAnalysis from "./id/analysis.json";
import idAuth from "./id/auth.json";
import idAutomation from "./id/automation.json";
import idByok from "./id/byok.json";
import idCommon from "./id/common.json";
import idContracts from "./id/contracts.json";
import idDashboard from "./id/dashboard.json";
import idDisclaimer from "./id/disclaimer.json";
import idDocuments from "./id/documents.json";
import idGovernance from "./id/governance.json";
import idHitl from "./id/hitl.json";
import idMatters from "./id/matters.json";
import idNav from "./id/nav.json";
import idSettings from "./id/settings.json";
import idSidebar from "./id/sidebar.json";
import idTopbar from "./id/topbar.json";
import idUsers from "./id/users.json";

const ID: Record<string, Tree> = {
  analysis: idAnalysis as unknown as Tree,
  auth: idAuth as unknown as Tree,
  automation: idAutomation as unknown as Tree,
  byok: idByok as unknown as Tree,
  common: idCommon as unknown as Tree,
  contracts: idContracts as unknown as Tree,
  dashboard: idDashboard as unknown as Tree,
  disclaimer: idDisclaimer as unknown as Tree,
  documents: idDocuments as unknown as Tree,
  governance: idGovernance as unknown as Tree,
  hitl: idHitl as unknown as Tree,
  matters: idMatters as unknown as Tree,
  nav: idNav as unknown as Tree,
  settings: idSettings as unknown as Tree,
  sidebar: idSidebar as unknown as Tree,
  topbar: idTopbar as unknown as Tree,
  users: idUsers as unknown as Tree,
};

// ── th — merged over English at load time ──────────
import thAnalysis from "./th/analysis.json";
import thAuth from "./th/auth.json";
import thAutomation from "./th/automation.json";
import thByok from "./th/byok.json";
import thCommon from "./th/common.json";
import thContracts from "./th/contracts.json";
import thDashboard from "./th/dashboard.json";
import thDisclaimer from "./th/disclaimer.json";
import thDocuments from "./th/documents.json";
import thGovernance from "./th/governance.json";
import thHitl from "./th/hitl.json";
import thMatters from "./th/matters.json";
import thNav from "./th/nav.json";
import thSettings from "./th/settings.json";
import thSidebar from "./th/sidebar.json";
import thTopbar from "./th/topbar.json";
import thUsers from "./th/users.json";

const TH: Record<string, Tree> = {
  analysis: thAnalysis as unknown as Tree,
  auth: thAuth as unknown as Tree,
  automation: thAutomation as unknown as Tree,
  byok: thByok as unknown as Tree,
  common: thCommon as unknown as Tree,
  contracts: thContracts as unknown as Tree,
  dashboard: thDashboard as unknown as Tree,
  disclaimer: thDisclaimer as unknown as Tree,
  documents: thDocuments as unknown as Tree,
  governance: thGovernance as unknown as Tree,
  hitl: thHitl as unknown as Tree,
  matters: thMatters as unknown as Tree,
  nav: thNav as unknown as Tree,
  settings: thSettings as unknown as Tree,
  sidebar: thSidebar as unknown as Tree,
  topbar: thTopbar as unknown as Tree,
  users: thUsers as unknown as Tree,
};

// ── vi — merged over English at load time ──────────
import viAnalysis from "./vi/analysis.json";
import viAuth from "./vi/auth.json";
import viAutomation from "./vi/automation.json";
import viByok from "./vi/byok.json";
import viCommon from "./vi/common.json";
import viContracts from "./vi/contracts.json";
import viDashboard from "./vi/dashboard.json";
import viDisclaimer from "./vi/disclaimer.json";
import viDocuments from "./vi/documents.json";
import viGovernance from "./vi/governance.json";
import viHitl from "./vi/hitl.json";
import viMatters from "./vi/matters.json";
import viNav from "./vi/nav.json";
import viSettings from "./vi/settings.json";
import viSidebar from "./vi/sidebar.json";
import viTopbar from "./vi/topbar.json";
import viUsers from "./vi/users.json";

const VI: Record<string, Tree> = {
  analysis: viAnalysis as unknown as Tree,
  auth: viAuth as unknown as Tree,
  automation: viAutomation as unknown as Tree,
  byok: viByok as unknown as Tree,
  common: viCommon as unknown as Tree,
  contracts: viContracts as unknown as Tree,
  dashboard: viDashboard as unknown as Tree,
  disclaimer: viDisclaimer as unknown as Tree,
  documents: viDocuments as unknown as Tree,
  governance: viGovernance as unknown as Tree,
  hitl: viHitl as unknown as Tree,
  matters: viMatters as unknown as Tree,
  nav: viNav as unknown as Tree,
  settings: viSettings as unknown as Tree,
  sidebar: viSidebar as unknown as Tree,
  topbar: viTopbar as unknown as Tree,
  users: viUsers as unknown as Tree,
};

// ── tl — merged over English at load time ──────────
import tlAnalysis from "./tl/analysis.json";
import tlAuth from "./tl/auth.json";
import tlAutomation from "./tl/automation.json";
import tlByok from "./tl/byok.json";
import tlCommon from "./tl/common.json";
import tlContracts from "./tl/contracts.json";
import tlDashboard from "./tl/dashboard.json";
import tlDisclaimer from "./tl/disclaimer.json";
import tlDocuments from "./tl/documents.json";
import tlGovernance from "./tl/governance.json";
import tlHitl from "./tl/hitl.json";
import tlMatters from "./tl/matters.json";
import tlNav from "./tl/nav.json";
import tlSettings from "./tl/settings.json";
import tlSidebar from "./tl/sidebar.json";
import tlTopbar from "./tl/topbar.json";
import tlUsers from "./tl/users.json";

const TL: Record<string, Tree> = {
  analysis: tlAnalysis as unknown as Tree,
  auth: tlAuth as unknown as Tree,
  automation: tlAutomation as unknown as Tree,
  byok: tlByok as unknown as Tree,
  common: tlCommon as unknown as Tree,
  contracts: tlContracts as unknown as Tree,
  dashboard: tlDashboard as unknown as Tree,
  disclaimer: tlDisclaimer as unknown as Tree,
  documents: tlDocuments as unknown as Tree,
  governance: tlGovernance as unknown as Tree,
  hitl: tlHitl as unknown as Tree,
  matters: tlMatters as unknown as Tree,
  nav: tlNav as unknown as Tree,
  settings: tlSettings as unknown as Tree,
  sidebar: tlSidebar as unknown as Tree,
  topbar: tlTopbar as unknown as Tree,
  users: tlUsers as unknown as Tree,
};

// ── km — merged over English at load time ──────────
import kmAnalysis from "./km/analysis.json";
import kmAuth from "./km/auth.json";
import kmAutomation from "./km/automation.json";
import kmByok from "./km/byok.json";
import kmCommon from "./km/common.json";
import kmContracts from "./km/contracts.json";
import kmDashboard from "./km/dashboard.json";
import kmDisclaimer from "./km/disclaimer.json";
import kmDocuments from "./km/documents.json";
import kmGovernance from "./km/governance.json";
import kmHitl from "./km/hitl.json";
import kmMatters from "./km/matters.json";
import kmNav from "./km/nav.json";
import kmSettings from "./km/settings.json";
import kmSidebar from "./km/sidebar.json";
import kmTopbar from "./km/topbar.json";
import kmUsers from "./km/users.json";

const KM: Record<string, Tree> = {
  analysis: kmAnalysis as unknown as Tree,
  auth: kmAuth as unknown as Tree,
  automation: kmAutomation as unknown as Tree,
  byok: kmByok as unknown as Tree,
  common: kmCommon as unknown as Tree,
  contracts: kmContracts as unknown as Tree,
  dashboard: kmDashboard as unknown as Tree,
  disclaimer: kmDisclaimer as unknown as Tree,
  documents: kmDocuments as unknown as Tree,
  governance: kmGovernance as unknown as Tree,
  hitl: kmHitl as unknown as Tree,
  matters: kmMatters as unknown as Tree,
  nav: kmNav as unknown as Tree,
  settings: kmSettings as unknown as Tree,
  sidebar: kmSidebar as unknown as Tree,
  topbar: kmTopbar as unknown as Tree,
  users: kmUsers as unknown as Tree,
};

// ── lo — merged over English at load time ──────────
import loAnalysis from "./lo/analysis.json";
import loAuth from "./lo/auth.json";
import loAutomation from "./lo/automation.json";
import loByok from "./lo/byok.json";
import loCommon from "./lo/common.json";
import loContracts from "./lo/contracts.json";
import loDashboard from "./lo/dashboard.json";
import loDisclaimer from "./lo/disclaimer.json";
import loDocuments from "./lo/documents.json";
import loGovernance from "./lo/governance.json";
import loHitl from "./lo/hitl.json";
import loMatters from "./lo/matters.json";
import loNav from "./lo/nav.json";
import loSettings from "./lo/settings.json";
import loSidebar from "./lo/sidebar.json";
import loTopbar from "./lo/topbar.json";
import loUsers from "./lo/users.json";

const LO: Record<string, Tree> = {
  analysis: loAnalysis as unknown as Tree,
  auth: loAuth as unknown as Tree,
  automation: loAutomation as unknown as Tree,
  byok: loByok as unknown as Tree,
  common: loCommon as unknown as Tree,
  contracts: loContracts as unknown as Tree,
  dashboard: loDashboard as unknown as Tree,
  disclaimer: loDisclaimer as unknown as Tree,
  documents: loDocuments as unknown as Tree,
  governance: loGovernance as unknown as Tree,
  hitl: loHitl as unknown as Tree,
  matters: loMatters as unknown as Tree,
  nav: loNav as unknown as Tree,
  settings: loSettings as unknown as Tree,
  sidebar: loSidebar as unknown as Tree,
  topbar: loTopbar as unknown as Tree,
  users: loUsers as unknown as Tree,
};

// ── my — merged over English at load time ──────────
import myAnalysis from "./my/analysis.json";
import myAuth from "./my/auth.json";
import myAutomation from "./my/automation.json";
import myByok from "./my/byok.json";
import myCommon from "./my/common.json";
import myContracts from "./my/contracts.json";
import myDashboard from "./my/dashboard.json";
import myDisclaimer from "./my/disclaimer.json";
import myDocuments from "./my/documents.json";
import myGovernance from "./my/governance.json";
import myHitl from "./my/hitl.json";
import myMatters from "./my/matters.json";
import myNav from "./my/nav.json";
import mySettings from "./my/settings.json";
import mySidebar from "./my/sidebar.json";
import myTopbar from "./my/topbar.json";
import myUsers from "./my/users.json";

const MY: Record<string, Tree> = {
  analysis: myAnalysis as unknown as Tree,
  auth: myAuth as unknown as Tree,
  automation: myAutomation as unknown as Tree,
  byok: myByok as unknown as Tree,
  common: myCommon as unknown as Tree,
  contracts: myContracts as unknown as Tree,
  dashboard: myDashboard as unknown as Tree,
  disclaimer: myDisclaimer as unknown as Tree,
  documents: myDocuments as unknown as Tree,
  governance: myGovernance as unknown as Tree,
  hitl: myHitl as unknown as Tree,
  matters: myMatters as unknown as Tree,
  nav: myNav as unknown as Tree,
  settings: mySettings as unknown as Tree,
  sidebar: mySidebar as unknown as Tree,
  topbar: myTopbar as unknown as Tree,
  users: myUsers as unknown as Tree,
};

// ── bn — merged over English at load time ──────────
import bnAnalysis from "./bn/analysis.json";
import bnAuth from "./bn/auth.json";
import bnAutomation from "./bn/automation.json";
import bnByok from "./bn/byok.json";
import bnCommon from "./bn/common.json";
import bnContracts from "./bn/contracts.json";
import bnDashboard from "./bn/dashboard.json";
import bnDisclaimer from "./bn/disclaimer.json";
import bnDocuments from "./bn/documents.json";
import bnGovernance from "./bn/governance.json";
import bnHitl from "./bn/hitl.json";
import bnMatters from "./bn/matters.json";
import bnNav from "./bn/nav.json";
import bnSettings from "./bn/settings.json";
import bnSidebar from "./bn/sidebar.json";
import bnTopbar from "./bn/topbar.json";
import bnUsers from "./bn/users.json";

const BN: Record<string, Tree> = {
  analysis: bnAnalysis as unknown as Tree,
  auth: bnAuth as unknown as Tree,
  automation: bnAutomation as unknown as Tree,
  byok: bnByok as unknown as Tree,
  common: bnCommon as unknown as Tree,
  contracts: bnContracts as unknown as Tree,
  dashboard: bnDashboard as unknown as Tree,
  disclaimer: bnDisclaimer as unknown as Tree,
  documents: bnDocuments as unknown as Tree,
  governance: bnGovernance as unknown as Tree,
  hitl: bnHitl as unknown as Tree,
  matters: bnMatters as unknown as Tree,
  nav: bnNav as unknown as Tree,
  settings: bnSettings as unknown as Tree,
  sidebar: bnSidebar as unknown as Tree,
  topbar: bnTopbar as unknown as Tree,
  users: bnUsers as unknown as Tree,
};

// ── jv — merged over English at load time ──────────
import jvAnalysis from "./jv/analysis.json";
import jvAuth from "./jv/auth.json";
import jvAutomation from "./jv/automation.json";
import jvByok from "./jv/byok.json";
import jvCommon from "./jv/common.json";
import jvContracts from "./jv/contracts.json";
import jvDashboard from "./jv/dashboard.json";
import jvDisclaimer from "./jv/disclaimer.json";
import jvDocuments from "./jv/documents.json";
import jvGovernance from "./jv/governance.json";
import jvHitl from "./jv/hitl.json";
import jvMatters from "./jv/matters.json";
import jvNav from "./jv/nav.json";
import jvSettings from "./jv/settings.json";
import jvSidebar from "./jv/sidebar.json";
import jvTopbar from "./jv/topbar.json";
import jvUsers from "./jv/users.json";

const JV: Record<string, Tree> = {
  analysis: jvAnalysis as unknown as Tree,
  auth: jvAuth as unknown as Tree,
  automation: jvAutomation as unknown as Tree,
  byok: jvByok as unknown as Tree,
  common: jvCommon as unknown as Tree,
  contracts: jvContracts as unknown as Tree,
  dashboard: jvDashboard as unknown as Tree,
  disclaimer: jvDisclaimer as unknown as Tree,
  documents: jvDocuments as unknown as Tree,
  governance: jvGovernance as unknown as Tree,
  hitl: jvHitl as unknown as Tree,
  matters: jvMatters as unknown as Tree,
  nav: jvNav as unknown as Tree,
  settings: jvSettings as unknown as Tree,
  sidebar: jvSidebar as unknown as Tree,
  topbar: jvTopbar as unknown as Tree,
  users: jvUsers as unknown as Tree,
};

const OVERRIDES: Partial<Record<Locale, Record<string, Tree>>> = {
  ms: MS,
  id: ID,
  th: TH,
  vi: VI,
  tl: TL,
  km: KM,
  lo: LO,
  my: MY,
  bn: BN,
  jv: JV,
};

/** Deep-merge every namespace of `locale` over the English tree. */
function buildBundle(locale: Locale): Record<string, unknown> {
  const overrides = OVERRIDES[locale];
  const bundle: Record<string, unknown> = {};
  for (const ns of Object.keys(EN)) {
    bundle[ns] = deepMerge(EN[ns] ?? {}, overrides?.[ns]);
  }
  return bundle;
}

/**
 * Every locale's full message tree — all namespaces merged.
 * Non-English locales are deep-merged over English so any missing
 * key silently falls through to the English string — no runtime gaps.
 */
export const BUNDLES: Record<Locale, Record<string, unknown>> = {
  en: buildBundle("en"),
  ms: buildBundle("ms"),
  id: buildBundle("id"),
  th: buildBundle("th"),
  vi: buildBundle("vi"),
  tl: buildBundle("tl"),
  km: buildBundle("km"),
  lo: buildBundle("lo"),
  my: buildBundle("my"),
  bn: buildBundle("bn"),
  jv: buildBundle("jv"),
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

/** Namespace names present in the message tree. */
export const NAMESPACES = ["analysis","auth","automation","byok","common","contracts","dashboard","disclaimer","documents","governance","hitl","matters","nav","settings","sidebar","topbar","users"] as const;
