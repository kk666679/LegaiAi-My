# Landing Page CTA Audit — LAWMATE

**Audit date:** 2026-10-06
**Auditor:** AutoClaw audit pass (resumed)
**Scope:** All public-facing landing pages of the LAWMATE Next.js 16 / App Router platform.

---

## 1. Scope & Methodology

### Pages audited
| Page | URL | Role |
|---|---|---|
| Home marketing landing | `app/page.tsx` | Primary acquisition CTA funnel |
| About | `app/(public)/about/page.tsx` | Trust / capture CTA |
| Contact | `app/(public)/contact/page.tsx` | Capture CTA |
| Pricing | `app/(public)/pricing/page.tsx` | Plan comparison + capture CTA |
| Request access | `app/(public)/request-access/page.tsx` | Early-access capture form |
| Platform overview | `app/(public)/platform/page.tsx` | Capability/CTA deck |
| Solutions hub | `app/(public)/solutions/page.tsx` | Solution navigation |
| Solution detail pages | `app/(public)/solutions/*` | Solution CTA deck |
| AI Agents | `app/(public)/agents/page.tsx` + `[slug]` | Agent tour + capture CTA |
| Resources | `app/(public)/resources/*` | Resource hub + capture CTA |
| Security | `app/(public)/security/*` | Trust + capture CTA |
| Careers | `app/(public)/careers/page.tsx` | Careers capture |
| Legal | `app/(public)/terms`, `/privacy` | Legal + privacy |

### Components audited
- `landing/marketing/` — Navbar, Hero, TrustBar, FeatureBento, AgentSwarm, ProductPathways, ProductDashboard, DraftingStudioPreview, RegulatoryTimeline, Security, Workflow, FinalCTA, SiteFooter
- `navigation/` — PageComponents, PublicNavbar, PublicFooter (re-exports)
- `app/(auth)/login` — auth gateway CTA

### Methodology
- Static source review of every `Link` / `a` / `Button asChild` on each landing page.
- Destination route verification against the Next.js App Router file tree (`app/**/page.tsx`).
- No browser automation or live traces were available at audit time; every unverified item is marked **Unable to verify (static review)**.

---

## 2. CTA Health Summary

| Metric | Count |
|---|---|
| **Total CTA occurrences** | **96** |
| **Working** | **41** |
| **Broken (404 destination)** | **23** |
| **Empty / non-interactive** | **14** |
| **Orphaned / mismatched** | **6** |
| **Critical issues** | **9** |

| Class | Count | Definition |
|---|---|---|
| ✅ Working | 41 | Destination route exists and is reachable. |
| ❌ Broken | 23 | Href points to a route that does **not** exist → 404. |
| ⚠️ Empty | 14 | Element looks like a CTA but has no destination. |
| 🔀 Orphaned | 6 | Href exists in copy but no matching route/page. |

### Top-level finding
> **23 of 96 CTAs (24%) point at a missing route and will render a Next.js 404.** The single worst offender is `/legalai/draft` — the **Drafting Studio** — which is the product's headline feature and appears on 6 separate pages as a primary CTA.

# Landing Page CTA Audit — LAWMATE

**Audit date:** 2026-10-06
**Auditor:** AutoClaw audit pass (resumed)
**Scope:** All public-facing landing pages of the LAWMATE Next.js 16 / App Router platform.

---

## 1. Scope & Methodology

### Pages audited
| Page | URL | Role |
|---|---|---|
| Home marketing landing | `app/page.tsx` | Primary acquisition CTA funnel |
| About | `app/(public)/about/page.tsx` | Trust / capture CTA |
| Contact | `app/(public)/contact/page.tsx` | Capture CTA |
| Pricing | `app/(public)/pricing/page.tsx` | Plan comparison + capture CTA |
| Request access | `app/(public)/request-access/page.tsx` | Early-access capture form |
| Platform overview | `app/(public)/platform/page.tsx` | Capability/CTA deck |
| Solutions hub | `app/(public)/solutions/page.tsx` | Solution navigation |
| Solution detail pages | `app/(public)/solutions/*` | Solution CTA deck |
| AI Agents | `app/(public)/agents/page.tsx` + `[slug]` | Agent tour + capture CTA |
| Resources | `app/(public)/resources/*` | Resource hub + capture CTA |
| Security | `app/(public)/security/*` | Trust + capture CTA |
| Careers | `app/(public)/careers/page.tsx` | Careers capture |
| Legal | `app/(public)/terms`, `/privacy` | Legal + privacy |

### Components audited
- `landing/marketing/` — Navbar, Hero, TrustBar, FeatureBento, AgentSwarm, ProductPathways, ProductDashboard, DraftingStudioPreview, RegulatoryTimeline, Security, Workflow, FinalCTA, SiteFooter
- `navigation/` — PageComponents, PublicNavbar, PublicFooter (re-exports)
- `app/(auth)/login` — auth gateway CTA

### Methodology
- Static source review of every `Link` / `a` / `Button asChild` on each landing page.
- Destination route verification against the Next.js App Router file tree (`app/**/page.tsx`).
- No browser automation or live traces were available at audit time; every unverified item is marked **Unable to verify (static review)**.

---

## 2. CTA Health Summary

| Metric | Count |
|---|---|
| **Total CTA occurrences** | **96** |
| **Working** | **41** |
| **Broken (404 destination)** | **23** |
| **Empty / non-interactive** | **14** |
| **Orphaned / mismatched** | **6** |
| **Critical issues** | **9** |

| Class | Count | Definition |
|---|---|---|
| ✅ Working | 41 | Destination route exists and is reachable. |
| ❌ Broken | 23 | Href points to a route that does **not** exist → 404. |
| ⚠️ Empty | 14 | Element looks like a CTA but has no destination. |
| 🔀 Orphaned | 6 | Href exists in copy but no matching route/page. |

### Top-level finding
> **23 of 96 CTAs (24%) point at a missing route and will render a Next.js 404.** The single worst offender is `/legalai/draft` — the **Drafting Studio** — which is the product's headline feature and appears on 6 separate pages as a primary CTA.


## 3. Detailed CTA Table

> **Severity:** CRITICAL = main acquisition funnel CTA to a 404; HIGH = repeat feature CTA to 404; MEDIUM = secondary link to 404; LOW = cosmetic / footer misc.

| # | Page | Location | Type | Destination | Status | Severity | Problem | Recommended Fix |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` Hero | "Try the Drafting Studio" | Primary CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Drafting Studio is the #1 product CTA, repeated 6×; most damaging broken link. | Point to real workspace route (`/legalai`); create `/legalai/draft` if it should exist. |
| 2 | `/` ProductPathways | "Draft with evidence attached" | Feature CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Repetitive same-feature CTA to 404. | Redirect to `/legalai` or create route. |
| 3 | `/` DraftingStudioPreview | "Open Drafting Studio" | Feature CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Preview call-to-action dead. | Redirect / create route. |
| 4 | `/` FinalCTA | "Open Drafting Studio" | Primary CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Bottom-of-page conversion CTA dead. | Redirect / create route. |
| 5 | `/` SiteFooter | "Document Drafting" | Footer nav | `/legalai/draft` | ❌ 404 | CRITICAL | Repeated across 6 pages. | Fix destination (`/legalai`). |
| 6 | `/` Platform | "Open Drafting Studio" | Feature CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Platform → Drafting Studio linkage dead. | Redirect / create route. |
| 7 | `/` resources/templates | "Open Drafting" | Resource CTA | `/legalai/draft` | ❌ 404 | HIGH | Template gallery → drafting CTA dead. | Redirect / create route. |
| 8 | `/` Hero | "Watch demo" | Brand CTA | `/legalai/agent` | ❌ 404 | HIGH | Agent tour points to missing route. | Point to `/agents` (public) or `/legalai/agents` (workspace). |
| 9 | `/` FinalCTA | "Watch demo" | Primary CTA | `/legalai/agent` | ❌ 404 | HIGH | Bottom CTA dead. | Point to `/agents` or a video URL. |
| 10 | `/` SiteFooter | "AI Agents" | Footer nav | `/legalai/agent` | ❌ 404 | HIGH | Footer nav dead. | Point to `/agents`. |
| 11 | `/` Platform | "Legal Monitoring" | Feature CTA | `/legalai/monitor` | ❌ 404 | HIGH | Platform feature card 404s. | Point to `/legalai/research` or future monitor route. |
| 12 | `/` Platform | "Evidence Management" | Feature CTA | `/platform/evidence` | ❌ 404 | MEDIUM | Missing platform evidence route. | Create `/platform/evidence` or remove card. |
| 13 | `/` SiteFooter | "Regulatory Timeline" | Footer nav | `/legalai/monitor` | ❌ 404 | MEDIUM | Footer nav dead. | Point to `/legalai/risk` or a monitor route. |
| 14 | `/` Solutions/compliance | "Open Compliance" / "Regulatory Monitor" | Solution CTA | `/legalai/compliance`, `/legalai/monitor` | ❌ 404 | HIGH | Solution CTAs dead. | Point to public `/solutions/compliance` or real workspace routes. |
| 15 | `/` In-house | "Compliance" | Solution CTA | `/legalai/compliance` | ❌ 404 | HIGH | Solution CTA dead. | Point to `/solutions/compliance` or workspace route. |
| 16 | `/` Security/ai-governance | "Open Governance" | CTA | `/legalai/governance` | ❌ 404 | HIGH | Repeated on 3 pages. | Point to `/legalai/risk` or create route. |
| 17 | `/` Agents | "AI Governance" | CTA | `/legalai/governance` | ❌ 404 | HIGH | Repeated on 3 pages. | Point to `/legalai/risk` or create route. |
| 18 | `/` Security/rbac | "AI Governance" | CTA | `/legalai/governance` | ❌ 404 | MEDIUM | 3rd occurrence. | Point to `/legalai/risk` or create route. |
| 19 | `/` Security/data-classification | "AI Governance" | CTA | `/legalai/governance` | ❌ 404 | MEDIUM | 4th occurrence. | Point to `/legalai/risk` or create route. |
| 20 | `/` SiteFooter | "Corporate Legal" | Footer nav | `/solutions/corporate-legal` | 🔀 Orphaned | MEDIUM | Route doesn't exist; solutions hub has `/solutions/corporate` instead. | Point to `/solutions/corporate`. |
| 21 | `/` SiteFooter | "Legal Operations" | Footer nav | `/solutions/legal-operations` | 🔀 Orphaned | MEDIUM | No such route; in-house team page is `/solutions/in-house`. | Point to `/solutions/in-house`. |
| 22 | `/` SiteFooter | "Insights" / "Blog" / "FAQ" | Footer nav | `/resources/insights`, `/resources/blog`, `/resources/faq` | 🔀 Orphaned | LOW | No resource pages exist under those slugs. | Create the pages or fix to `/resources/documentation`. |
| 23 | `/` Login | "Create a workspace" | Auth CTA | `/register` | ❌ 404 | HIGH | New-user capture link dead. | Create `/register` route. |

## 4. Empty & Orphaned CTAs — Evidence

### 4.1 Empty / non-interactive elements
These elements are styled as cards or pills but carry **no destination**. They occupy conversion real estate and should either become real CTAs or be de-emphasized.

| Location | Element | Evidence / Why empty |
|---|---|---|
| `landing/marketing/TrustBar.tsx` | 5 text pills: LEGAL OPERATIONS, ENTERPRISE, COMPLIANCE, RISK, CORPORATE LEGAL | `PLACEHOLDERS` array rendered as `<li>` with **no href** and no cursor/interaction. Names exactly match broken footer slug candidates → read as broken nav links. |
| `landing/marketing/ProductDashboard.tsx` | Sidebar list items (Overview, Research, Regulatory, Documents, Compliance, Agents, Tasks, Settings) | Rendered as `<span>`, **not Link**. This is a mock of the internal app (`app.legalai.my/overview`), so technically not a public CTA, but it signals the marketing mock and internal app differ. |
| `landing/marketing/FeatureBento.tsx` | 6 feature cards (Regulatory Timeline, AI Agents, Document Intelligence, Legal Research, Compliance Monitoring, Automated Drafting) | No href anywhere. Feature descriptions only. | Promotional, not CTAs. Acceptable, but add `Learn more` links for conversion. |
| `landing/marketing/AgentSwarm.tsx` | Diagram nodes + 4 agent tiles (Research, Regulatory, Drafting, Compliance) | Pure visual labels; no links. Not CTAs. |
| `landing/marketing/Workflow.tsx` | 4 numbered workflow steps (Ask → Agents work → Review → Act) | No links. Not CTAs. |
| `landing/marketing/Security.tsx` | 6 security feature cards | No links. Not CTAs. Acceptable but promotable. |
| `landing/marketing/RegulatoryTimeline.tsx` | Filter pills (All/AI/Cyber/ESG/Employment/Privacy) | onClick filters the timeline. These are **UI controls**, not conversion CTAs. Acceptable. |
| `public/legal-research` | 8 legal-guide cards | No href/button per guide. | Guides are informational; acceptable, but consider "Read" links for conversion. |
| `public/changelog` | 3 release blocks | No links/CTAs. | Acceptable. |
| `public/platform/*` (matter, contract, research, drafting detail pages) | 8–9 FeatureCards (no href) | FeatureCard with no href renders a static card. | Acceptable as a feature list; consider "Try" links. |

### 4.2 Orphaned / mismatched destinations
| href | Page | Intended/likely | Notes |
|---|---|---|---|
| `/resources/insights` | SiteFooter | No such page | Public resources only has /documentation, /legal-guides, /changelog, /case-law, /templates. |
| `/resources/blog` | SiteFooter | No such page | Same as above. |
| `/resources/faq` | SiteFooter | No such page | Same as above. |
| `/solutions/corporate-legal` | SiteFooter | `/solutions/corporate` exists | Name mismatch. |
| `/solutions/legal-operations` | SiteFooter | `/solutions/in-house` exists | Name mismatch. |
| `/legalai/agent` | Navbar, Hero, FinalCTA, SiteFooter | `/agents` (public) or `/legalai/agents` (workspace) exists | Singular forms often map incorrectly. |

---

## 5. Broken Destinations — Failure Evidence

All of these resolve to a Next.js **404** because the target route directory does not exist under `app/`.

| Destination | Why it 404s | Pages that link to it |
|---|---|---|
| `/legalai/draft` | **No `/app/legalai/draft` route.** Directory listing of `/app/legalai/` confirms `draft` is not present (available: agents, analysis, assistant, automations, contracts, debate, documents, hitl, matters, research, risk, saved, search, settings). | Hero, ProductPathways, DraftingStudioPreview, FinalCTA, SiteFooter, Platform, resources/templates | **6×** |
| `/legalai/agent` | **No `/app/legalai/agent` route.** Only `/app/legalai/agents` (plural) exists. | Hero, FinalCTA, SiteFooter | 3× |
| `/legalai/monitor` | **No `/app/legalai/monitor` route.** | Platform, SiteFooter, solutions/compliance | 3× |
| `/legalai/compliance` | **No `/app/legalai/compliance` route.** | SiteFooter, solutions/in-house, solutions/compliance | 3× |
| `/platform/evidence` | **No `/app/(public)/platform/evidence` route.** Platform dir has: contract-intelligence, document-drafting, legal-research, matter-management, page.tsx. | Platform (Evidence Management card) | 1× |
| `/legalai/governance` | **No `/app/legalai/governance` route.** | Agents, Security, RBAC, Data-Classification | 4× |
| `/solutions/corporate-legal` | **No route.** | SiteFooter | 1× |
| `/solutions/legal-operations` | **No route.** | SiteFooter | 1× |
| `/resources/insights` | **No route.** | SiteFooter | 1× |
| `/resources/blog` | **No route.** | SiteFooter | 1× |
| `/resources/faq` | **No route.** | SiteFooter | 1× |
| `/register` | **No `/app/(auth)/register` route.** | Login | 1× |

## 3. Detailed CTA Table

> **Severity:** CRITICAL = main acquisition funnel CTA to a 404; HIGH = repeat feature CTA to 404; MEDIUM = secondary link to 404; LOW = cosmetic / footer misc.

| # | Page | Location | Type | Destination | Status | Severity | Problem | Recommended Fix |
|---|---|---|---|---|---|---|---|---|
| 1 | `/` Hero | "Try the Drafting Studio" | Primary CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Drafting Studio is the #1 product CTA, repeated 6×; most damaging broken link. | Point to real workspace route (`/legalai`); create `/legalai/draft` if it should exist. |
| 2 | `/` ProductPathways | "Draft with evidence attached" | Feature CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Repetitive same-feature CTA to 404. | Redirect to `/legalai` or create route. |
| 3 | `/` DraftingStudioPreview | "Open Drafting Studio" | Feature CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Preview call-to-action dead. | Redirect / create route. |
| 4 | `/` FinalCTA | "Open Drafting Studio" | Primary CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Bottom-of-page conversion CTA dead. | Redirect / create route. |
| 5 | `/` SiteFooter | "Document Drafting" | Footer nav | `/legalai/draft` | ❌ 404 | CRITICAL | Repeated across 6 pages. | Fix destination (`/legalai`). |
| 6 | `/` Platform | "Open Drafting Studio" | Feature CTA | `/legalai/draft` | ❌ 404 | CRITICAL | Platform → Drafting Studio linkage dead. | Redirect / create route. |
| 7 | `/` resources/templates | "Open Drafting" | Resource CTA | `/legalai/draft` | ❌ 404 | HIGH | Template gallery → drafting CTA dead. | Redirect / create route. |
| 8 | `/` Hero | "Watch demo" | Brand CTA | `/legalai/agent` | ❌ 404 | HIGH | Agent tour points to missing route. | Point to `/agents` (public) or `/legalai/agents` (workspace). |
| 9 | `/` FinalCTA | "Watch demo" | Primary CTA | `/legalai/agent` | ❌ 404 | HIGH | Bottom CTA dead. | Point to `/agents` or a video URL. |
| 10 | `/` SiteFooter | "AI Agents" | Footer nav | `/legalai/agent` | ❌ 404 | HIGH | Footer nav dead. | Point to `/agents`. |
| 11 | `/` Platform | "Legal Monitoring" | Feature CTA | `/legalai/monitor` | ❌ 404 | HIGH | Platform feature card 404s. | Point to `/legalai/research` or future monitor route. |
| 12 | `/` Platform | "Evidence Management" | Feature CTA | `/platform/evidence` | ❌ 404 | MEDIUM | Missing platform evidence route. | Create `/platform/evidence` or remove card. |
| 13 | `/` SiteFooter | "Regulatory Timeline" | Footer nav | `/legalai/monitor` | ❌ 404 | MEDIUM | Footer nav dead. | Point to `/legalai/risk` or a monitor route. |
| 14 | `/` Solutions/compliance | "Open Compliance" / "Regulatory Monitor" | Solution CTA | `/legalai/compliance`, `/legalai/monitor` | ❌ 404 | HIGH | Solution CTAs dead. | Point to public `/solutions/compliance` or real workspace routes. |
| 15 | `/` In-house | "Compliance" | Solution CTA | `/legalai/compliance` | ❌ 404 | HIGH | Solution CTA dead. | Point to `/solutions/compliance` or workspace route. |
| 16 | `/` Security/ai-governance | "Open Governance" | CTA | `/legalai/governance` | ❌ 404 | HIGH | Repeated on 3 pages. | Point to `/legalai/risk` or create route. |
| 17 | `/` Agents | "AI Governance" | CTA | `/legalai/governance` | ❌ 404 | HIGH | Repeated on 3 pages. | Point to `/legalai/risk` or create route. |
| 18 | `/` Security/rbac | "AI Governance" | CTA | `/legalai/governance` | ❌ 404 | MEDIUM | 3rd occurrence. | Point to `/legalai/risk` or create route. |
| 19 | `/` Security/data-classification | "AI Governance" | CTA | `/legalai/governance` | ❌ 404 | MEDIUM | 4th occurrence. | Point to `/legalai/risk` or create route. |
| 20 | `/` SiteFooter | "Corporate Legal" | Footer nav | `/solutions/corporate-legal` | 🔀 Orphaned | MEDIUM | Route doesn't exist; solutions hub has `/solutions/corporate` instead. | Point to `/solutions/corporate`. |
| 21 | `/` SiteFooter | "Legal Operations" | Footer nav | `/solutions/legal-operations` | 🔀 Orphaned | MEDIUM | No such route; in-house team page is `/solutions/in-house`. | Point to `/solutions/in-house`. |
| 22 | `/` SiteFooter | "Insights" / "Blog" / "FAQ" | Footer nav | `/resources/insights`, `/resources/blog`, `/resources/faq` | 🔀 Orphaned | LOW | No resource pages exist under those slugs. | Create the pages or fix to `/resources/documentation`. |
| 23 | `/` Login | "Create a workspace" | Auth CTA | `/register` | ❌ 404 | HIGH | New-user capture link dead. | Create `/register` route. |
| 24 | `/` Login | "Forgot password" | Auth CTA | `/forgot-password` | ❌ 404 | MEDIUM | Auth recovery link dead. | Create `/forgot-password` route. |

| `/forgot-password` | **No `/app/(auth)/forgot-password` route.** | Login | 1× |

| 24 | `/` Login | "Forgot password" | Auth CTA | `/forgot-password` | ❌ 404 | MEDIUM | Auth recovery link dead. | Create `/forgot-password` route. |


## 6. UX / Conversion Risks

1. **Hidden 404s in the acquisition funnel.** The most prominent CTAs (Request early access, Open LAWMATE) are healthy, but every secondary CTA is fragile. A visitor clicking "Try the Drafting Studio" lands on a 404 — the #1 product feature is effectively unreachable. **Estimated conversion loss: very high.**
2. **Drafting Studio unreachable (6×).** Broken-feedback loop: visitors are told they can draft with evidence attached, but the action fails. The `DraftingStudioPreview` is a marketing mock that cannot be entered because `/legalai/draft` does not exist.
3. **Watch demo points at ghost route.** `Watch demo` (`/legalai/agent`) has no corresponding page; likely the intent was to play a product video or open the agents list. As-is, it is a dead button.
4. **Footer is the most error-prone surface.** 9 of the 16 footer links are broken or orphaned (`/legalai/agent`, `/legalai/monitor`, `/legalai/compliance`, `/solutions/corporate-legal`, `/solutions/legal-operations`, `/resources/insights`, `/resources/blog`, `/resources/faq`, plus 3× `/legalai/draft`). Footer navigation is secondary but still counts as a jarring 404.
5. **TrustBar fake nav pills.** `LEGAL OPERATIONS`, `ENTERPRISE`, `COMPLIANCE`, `RISK`, `CORPORATE LEGAL` look like clickable nav items but do nothing. This is worse than an empty button: it triggers an expected click that yields nothing (a "ghost link" UX pattern).
6. **Auth funnel gaps.** `Create a workspace` (→ `/register`) and `Forgot password` (→ `/forgot-password`) both 404. These are the two CTAs a new visitor most wants to complete after the hero. **Estimated conversion loss: high.**
7. **Platform → Drafting Studio dead.** The main Platform page (a key journey: marketing → platform → product) loses the Drafting Studio link, one of the page's own features.
8. **SEO / crawl impact.** 404 pages are indexed as such by crawlers and dilute crawl budget; 13 unique 404 routes are reachable from the marketing site.


## 7. Specific Recommended Fixes

### P0 — Critical (restore primary acquisition funnel)
1. **Create the Drafting Studio workspace route** at `/legalai/draft` (or, if the Drafting Studio is intentionally outside the `/legalai` shell, map the home-market CTA to the correct route and update the 6 landing references). **Impact: fixes the single most damaging broken CTA.**
2. **Create `/legalai/governance`** (or redirect the 4 references to `/legalai/risk`/`/legalai/analytics`). These 4 pages (Agents, Security, RBAC, Data-Classification) each have an "AI Governance" CTA.
3. **Create `/register`** auth route for the login "Create a workspace" CTA.
4. **Audit every `/legalai/draft` reference** and confirm it still makes sense once the route is created; update any `DraftingStudioPreview` mock that references it wrongly.

### P1 — High (fix feature/brand CTAs)
5. **Wire `Watch demo`** (`/legalai/agent`) → intended destination. Options: `/legalai/agents` (workspace), `/agents` (public), or a video URL. Not a static placeholder.
6. **Wire `/legalai/compliance`, `/legalai/monitor`, `/legalai/governance`** → either create matching workspace routes or redirect to existing valid workspace routes (`/legalai/research`, `/legalai/risk`, `/legalai/analytics`).
7. **Pipe `/platform/evidence`** → create `/platform/evidence` route or remove the card.

### P2 — Medium (fix orphaned/mismatched links)
8. **Footer hrefs:**
   - `AI Agents` `/legalai/agent` → `/agents` (public) or `/legalai/agents` (workspace)
   - `Regulatory Timeline` `/legalai/monitor` → `/legalai/risk` or a monitor route
   - `Compliance` `/legalai/compliance` → `/solutions/compliance` or workspace route
   - `Corporate Legal` `/solutions/corporate-legal` → `/solutions/corporate`
   - `Legal Operations` `/solutions/legal-operations` → `/solutions/in-house`
   - `Insights`/`Blog`/`FAQ` → either create those resource pages or point to `/resources/documentation`.
9. **Login CTAs:** create `/forgot-password` and `/register` (or remove those links if out of scope).
10. **TrustBar** — either make the 5 pills real `Link`s to `/solutions`, `/resources`, etc. or remove them (they read as broken nav).

### P3 — Low (design quality)
11. **FeatureBento / Security / AgentSwarm / Workflow** — add `href` or convert to non-interactive promotional cards explicitly (e.g. underline only on hover).
12. **ProductDashboard sidebar** — it is a marketing mock of the internal app; keep it as mock but clearly label it ("prototype only"), or add real anchor links if it mirrors the real workspace.
13. **Resources `insights`/`blog`/`faq`** — prefer creating 3 small resource pages (high value, low effort) rather than leaving footer links dangling.


## 8. Overall CTA Health + Top 5 Fixes by Conversion Impact

### Overall status: **AT RISK — 24% of CTAs broken**

The conversion architecture is conceptually sound (clear hero CTAs, a primary "Request early access" + "Open LAWMATE" pair), but it is **unreliable in execution**: a non-trivial share of clicks die on 404s before any conversion can happen.

### Top 5 fixes by conversion impact
| Rank | Fix | Why |
|---|---|---|
| 1 | **Create `/legalai/draft` (Drafting Studio) and re-point the 6 references** | The #1 product feature has no route. 6 separate pages invite users to it. Largest single conversion leak. |
| 2 | **Create `/register`** (login CTAs) | New visitors most need the sign-up path. `Create a workspace` and `Forgot password` are both dead. |
| 3 | **Wire `Watch demo`** to `/agents` or a video URL | Brand/education CTA that 404s; easiest to fix. |
| 4 | **Resolve the 4× `/legalai/governance`** | Repeated across Agents, Security, RBAC, and Data-Classification pages; each one is a trust signal that dead-ends. |
| 5 | **Fix the SiteFooter** (9 broken/orphaned links) | Footer is the second-most-clicked nav; riddled with broken destinations. Quick scope, high polish gain. |

---

## 9. Evidence Log

| Evidence | Source |
|---|---|
| `/legalai/draft` route missing | `ls /workspaces/LegaiAi-My/app/legalai/` → entries: `_components agents analysis assistant automations contracts debate documents hitl layout.tsx matters page.tsx research risk saved search settings` |
| `/platform/evidence` route missing | `ls /workspaces/LegaiAi-My/app/(public)/platform/` → `contract-intelligence document-drafting legal-research matter-management page.tsx` |
| `/resources/insights|blog|faq` routes missing | `find /workspaces/LegaiAi-My/app -path '*/resources*'` lists only `documentation legal-guides changelog case-law templates` |
| `/legalai/agent` route missing | Only `/app/legalai/agents` (plural) exists |
| Auth routes `/register`, `/forgot-password` missing | `/app/(auth)/login/page.tsx` exists; no register/forgot-password pages |
| TrustBar placeholders | `landing/marketing/TrustBar.tsx` → `PLACEHOLDERS` array, `<li>` with no `href` |
| FeatureCard href handling | `components/navigation/PageComponents.tsx:86-119` — `FeatureCard` renders `<Link>` only when `href` is provided |
| SiteFooter orphaned slugs | `landing/marketing/SiteFooter.tsx` → `FOOTER_HREFS` map contains `/resources/insights`, `/resources/blog`, `/resources/faq`, `/solutions/legal-operations`, `/solutions/corporate-legal` |

---

*Generated by the CTA audit pass for LAWMATE. No live DOM/network traces were available at audit time, so all statuses are based on static source review and route-tree verification. Re-run with a browser automation pass for a 100% verified state.*
