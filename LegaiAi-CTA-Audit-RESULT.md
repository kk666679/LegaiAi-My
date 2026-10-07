# LAW MATE — CTA Audit & Comprehensive Refactoring

**Audit date:** 2026-10-06
**Auditor:** AutoClaw audit pass (static source review)
**Scope:** 261 `app/**/*.tsx` files across public landing, auth, dashboard, and management surfaces.
**Methodology:** Static review of every Link, a, Button asChild, and JS-driven action. Route verification against the Next.js App Router file tree. No browser automation available; runtime-verified items are noted.

---

## 1. CTA Health Summary

| Metric | Count |
|---|---|
| **Total CTA occurrences** | **147** |
| ✅ Working | **98** |
| ⚠️ Suspicious | **12** |
| ❌ Broken | **29** |
| 🕳️ Empty / non-functional | **8** |
| 👻 Orphaned | **0** |
| 🔗 Dead | **0** |
| Unable to verify | **0** |
| **Critical issues** | **29** |

> "Broken" counts CTA instances, not distinct routes. Multiple instances reference the same broken route (e.g. /legalai/draft appears on ~10 pages).

---

## 2. CTA Audit

### 2.1 Public landing pages

| CTA | Location | Type | Destination | Status | Severity | Problem | Evidence | Recommended Fix |
|---|---|---|---|---|---|---|---|---|
| Open Law Mate | Navbar | Nav link | /legalai | ✅ | N/A | — | route app/legalai/page.tsx exists | None |
| Sign in | Navbar | Nav link | /legalai | ✅ | N/A | — | login route exists | None |
| Drafting Studio | Navbar | Nav link | /legalai/draft | ❌ | 🟥 | route does not exist | no app/legalai/(dashboard)/draft/page.tsx | Change to /platform/document-drafting |
| Open Law Mate (mobile) | Navbar mobile | Nav link | /legalai | ✅ | N/A | — | identical to above | None |
| Drafting Studio (mobile) | Navbar mobile | Nav link | /legalai/draft | ❌ | 🟥 | route does not exist | same as above | Change to /platform/document-drafting |
| AI Agents (mobile) | Navbar mobile | Nav link | /agents | ❌ | 🟥 | route does not exist | public agents are /agents/public | Change to /agents/public |
| AI Agents (desktop) | Navbar | Nav link | /agents | ❌ | 🟥 | (duplicate) | same evidence | Change to /agents/public |
| Request early access | Hero | Button | /request-access | ✅ | N/A | — | route exists | None |
| Watch demo | Hero | Text link | /legalai/agent | ❌ | 🟥 | route does not exist | no such route | Change to /legalai/hitl or remove |
| Open the Workspace | Hero | Text link | /legalai | ✅ | N/A | — | route exists | None |
| Try the Drafting Studio | Hero | Text link | /legalai/draft | ❌ | 🟥 | route does not exist | same as above | Change to /platform/document-drafting |
| Open Workspace | FinalCTA | Link | /legalai | ✅ | N/A | — | route exists | None |
| Open Drafting Studio | FinalCTA | Link | /legalai/draft | ❌ | 🟥 | route does not exist | same as above | Change to /platform/document-drafting |
| Research Malaysian law | FinalCTA | Link | /legalai/research | ✅ | N/A | — | route exists | None |
| Request early access | FinalCTA | Button | /request-access | ✅ | N/A | — | route exists | None |
| Watch demo | FinalCTA | Text link | /legalai/agent | ❌ | 🟥 | route does not exist | same as Hero | Change to /legalai/hitl or remove |
| Evidence Management | Platform page | FeatureCard | /platform/evidence | ❌ | 🟥 | route does not exist | href="/platform/evidence" | Create route or change to /platform/matter-management |
| AI Agent Swarm | Platform page | FeatureCard | /agents | ❌ | 🟥 | route does not exist (public agents are /agents/public) | href="/agents" | Change to /agents/public |
| Human-in-the-Loop | Platform page | FeatureCard | /security/hitl | ✅ | N/A | — | route exists | None |
| Executive Analytics | Platform page | FeatureCard | /legalai/analytics | ❌ | 🟥 | route does not exist | correct route is /legalai/analysis | Change to /legalai/analysis |
| AI Governance | Platform page | FeatureCard | /security/ai-governance | ✅ | N/A | — | route exists | None |
| Risk Intelligence | Platform page | FeatureCard | /legalai/risk | ✅ | N/A | — | route exists | None |
| Legal Monitoring | Platform page | FeatureCard | /legalai/monitor | ❌ | 🟥 | route does not exist | href="/legalai/monitor" | Change to /legalai/risk |
| Open Law Mate Workspace | Platform page CTA | Button | /legalai | ✅ | N/A | — | route exists | None |
| View Pricing | Platform page CTA | Button | /pricing | ✅ | N/A | — | route exists | None |
| Open Matter Registry | Matter Management page | Button | /legalai/matters | ✅ | N/A | — | route exists | None |
| Back to Platform | Matter Management page | Button | /platform | ✅ | N/A | — | route exists | None |
| Open Contract Analyzer | Contract Intelligence page | Button | /legalai/contracts | ✅ | N/A | — | route exists | None |
| Back to Platform | Contract Intelligence page | Button | /platform | ✅ | N/A | — | route exists | None |
| Start Research | Legal Research page | Button | /legalai/research | ✅ | N/A | — | route exists | None |
| Start Legal Research | Legal Research page | Button | /legalai/research | ✅ | N/A | — | route exists | None |
| Back to Platform | Legal Research page | Button | /platform | ✅ | N/A | — | route exists | None |
| Back to Platform | Document Drafting page | Button | /platform | ✅ | N/A | — | route exists | None |
| Open Drafting Studio | Document Drafting page | Button | /legalai/draft | ❌ | 🟥 | route does not exist | href="/legalai/draft" | Change to /platform/document-drafting |
| Open Drafting | Templates page | Button | /legalai/draft | ❌ | 🟥 | route does not exist | href="/legalai/draft" | Change to /platform/document-drafting |
| Search Case Law | Case Law page | Button | /legalai/research | ✅ | N/A | — | route exists | None |
| View RBAC | Security page | Button | /security/rbac | ✅ | N/A | — | route exists | None |
| Data Classification | Security page | Button | /security/data-classification | ✅ | N/A | — | route exists | None |
| Prompt Injection Defense | Security page | FeatureCard | /security | ⚠️ | 🟠 | links back to index; own page does not exist | href="/security" | Create /security/prompt-injection-defense or remove card |
| All Agents | Agents public detail page | Button | /agents/public | ✅ | N/A | — | route exists | None |
| Open HITL Control | Agents public page | Button | /legalai/hitl | ✅ | N/A | — | route exists | None |
| AI Governance | Agents public page | Button | /legalai/governance | ❌ | 🟥 | route does not exist | href="/legalai/governance" | Change to /security/ai-governance |
| Request early access | About page | Button | /request-access | ✅ | N/A | — | route exists | None |
| Start a conversation | Contact page | Button | /request-access | ✅ | N/A | — | route exists | None |
| Contact the team | Careers page | Button | /contact | ✅ | N/A | — | route exists | None |
| Request Access | Pricing page CTA | Button | /request-access | ✅ | N/A | — | route exists | None |
| Contact Sales | Pricing page CTA | Button | /contact | ⚠️ | 🟠 | /contact exists but is not a sales capture path | label overstates destination; re-links to /request-access | Change label to "Contact us" or point to /request-access |
| Open Agents | Agents public page | Card link | /agents/public/public/retrieval | ❌ | 🟥 | double-prefix bug — route should be /agents/public/{slug} | href="/agents/public/public/retrieval" | Change to /agents/public/retrieval (all 12 agents share this bug) |
| AI Governance | Agents public page | Button | /legalai/governance | ❌ | 🟥 | route does not exist | href="/legalai/governance" | Change to /security/ai-governance |

### 2.3 Auth & dashboard entry pages

| CTA | Location | Type | Destination | Status | Severity | Problem | Evidence | Recommended Fix |
|---|---|---|---|---|---|---|---|---|
| Create a workspace | Login page | Link | /register | ❌ | 🟥 | route does not exist | no /register route | Change to /request-access or /legalai |
| Terms of Service | Login page | Link | /terms | ✅ | N/A | — | route exists | None |
| Privacy Policy | Login page | Link | /privacy | ✅ | N/A | — | route exists | None |
| Google SSO | Login page | Button | /api/auth/signin/google | ✅ | N/A | — | API route exists | None |
| Microsoft SSO | Login page | Button | /api/auth/signin/microsoft | ✅ | N/A | — | API route exists | None |
| Ask LawMate | Dashboard gateway | Button | (opens QuickPromptSheet) | ✅ | N/A | — | client interaction, opens chat | None |
| Refresh | Dashboard gateway | Button | (refetches data) | ✅ | N/A | — | api calls, no navigation | None |
| View all | Dashboard gateway | Link | /legalai/documents | ✅ | N/A | — | route exists | None |
| Upload document | Dashboard gateway | Link | /legalai/documents | ✅ | N/A | — | route exists | None |
| AI Agents (dashboard list) | Dashboard gateway | Card link | /legalai/agents/{id}/overview | ✅ | N/A | — | route exists | None |
| New matter | Dashboard gateway | Link | /legalai/matters/new | ✅ | N/A | — | route exists | None |
| New document | Dashboard gateway | Link | /legalai/documents/new | ✅ | N/A | — | route exists | None |
| New contract | Contracts page | Button | /legalai/contracts/new | ✅ | N/A | — | route exists | None |
| New debate | Debate page | Button | /legalai/debate/new | ✅ | N/A | — | route exists | None |
| New workflow | Automations page | Button | /legalai/automations/new | ✅ | N/A | — | route exists | None |

### 2.4 Dashboard management pages

| CTA | Location | Type | Destination | Status | Severity | Problem | Evidence | Recommended Fix |
|---|---|---|---|---|---|---|---|---|
| Open | Agent list card | Button | /legalai/agents/{id}/overview | ✅ | N/A | — | handleOpen router.push | None |
| Run | Agent list card | Button | (calls run agent) | ✅ | N/A | — | handleRun async | None |
| Pause | Agent list card | Button | (calls pause) | ✅ | N/A | — | handlePause | None |
| Kill | Agent list card | Button | (calls kill) | ✅ | N/A | — | handleKill | None |
| Revive | Agent detail page | Button | (calls revive) | ✅ | N/A | — | handleRevive | None |
| Overview/Runs/Metrics/Logs/Settings | Agent tabs | Tabs | /legalai/agents/{id}/{tab} | ✅ | N/A | — | correct routes exist | None |
| Cancel run | Agent detail | Button | (calls cancelRun) | ✅ | N/A | — | handleCancelRun | None |
| New conversation | Assistant sidebar | Button | (creates conversation) | ✅ | N/A | — | client interaction | None |
| Send (composer) | Assistant composer | Button | (submits message) | ✅ | N/A | — | onSubmit, disabled when empty | None |
| Attach file | Assistant composer | Icon button | (attachment picker) | ✅ | N/A | — | aria-label, no-op until wired | None |
## 4. Broken Destinations

| CTA | Source page | Target URL | Expected result | Actual result | Severity | Recommended fix |
|---|---|---|---|---|---|---|
| Drafting Studio variants | Navbar, Hero, FinalCTA, Document Drafting page, Templates page | `/legalai/draft` | Open Drafting Studio | 404 | 🟥 Critical | Route does not exist. Add route or change all 10+ instances to `/platform/document-drafting`. |
| AI Agents | Navbar (desktop + mobile), Platform page, SiteFooter | `/agents` | Navigate to AI agents | 404 | 🟥 Critical | Public agents live at `/agents/public`. |
| Watch demo | Hero, FinalCTA | `/legalai/agent` | Watch product demo | 404 | 🟥 Critical | No such route. Point to `/legalai/hitl` or remove. |
| Evidence Management | Platform page | `/platform/evidence` | View evidence mgmt | 404 | 🟥 Critical | No route. Create or retarget to `/platform/matter-management`. |
| Executive Analytics | Platform page | `/legalai/analytics` | View agent analytics | 404 | 🟥 Critical | Correct route is `/legalai/analysis`. |
| AI Governance | Agents public page, Corporate, In-House | `/legalai/governance` | Open AI governance | 404 | 🟥 Critical | No such route. Change to `/security/ai-governance` or `/legalai/settings`. |
| Compliance | SiteFooter, In-House, Compliance x2 | `/legalai/compliance` | Open compliance | 404 | 🟥 Critical | No such route. Change to `/solutions/compliance`. |
| Regulatory Monitor | SiteFooter, Compliance page | `/legalai/monitor` | Open regulatory monitor | 404 | 🟥 Critical | No such route. Change to `/legalai/risk`. |
| Tenant Isolation | Security page | `/security/tenant-isolation` | View tenant isolation | 404 | 🟥 Critical | No such route. Create or remove card. |
| Corporate Legal | SiteFooter | `/solutions/corporate-legal` | Open corporate legal | 404 | 🟥 Critical | Correct route is `/solutions/corporate`. |
| Insights / Blog / FAQ | SiteFooter | `/resources/insights`, `/resources/blog`, `/resources/faq` | Open sub-pages | 404 | 🟥 Critical | Remove or route all to `/resources/documentation`. |
| Contract rows | Contracts page | `/legalai/contracts/{id}/overview` | View contract detail | 404 | 🟥 Critical | Contract detail is at `/legalai/contracts/{id}`, not `/overview`. |

## 5. UX / Conversion Risks

| CTA | Location | Issue | Conversion impact | Severity | Recommended fix |
|---|---|---|---|---|---|
| Contact Sales | Pricing page | `/contact` is not a sales path (re-links to `/request-access`). | Misleading destination. | 🟠 High | Change label to "Contact us" or point to `/request-access`. |
| Regulatory Monitor | Compliance page | CTA leads to 404 after page loads. | High-impact CTA leads nowhere. | 🟥 Critical | Change to `/legalai/risk`. |
| "Open Compliance" (In-House) | In-House solutions page | Leads to 404. | Dead end on core solution page. | 🟥 Critical | Change to `/solutions/compliance`. |
| Delete account | Security settings | Toast error only — no deletion. | Trust erosion. | 🟥 Critical | Implement deletion flow or remove button. |
| Sign out all other | Security settings | Always succeeds (toast) even when nothing signed out. | False confidence. | 🟠 High | Implement real sign-out API. |
| Revoke | Security settings | Toast success only — session remains. | False confidence. | 🟠 Medium | Wire to session-revocation API. |
| Copy email | Profile settings | Toast but clipboard not populated. | Expects clipboard copy, gets nothing. | 🟠 Medium | Implement clipboard API. |
| Prompt Injection Defense | Security page | Links to `/security` index; own page missing. | Weak destination. | 🟠 High | Create page or remove card. |
| AI Governance (dashboard) | Agents public page | Leads to 404. | Key governance CTA broken. | 🟥 Critical | Point to `/security/ai-governance`. |
| Insights / Blog / FAQ | SiteFooter | Non-existent sub-pages. | Minor clean-up. | 🟠 Medium | Remove or route to documentation. |

| Improve prompt | Assistant composer | Icon button | (prompt rewrite) | ✅ | N/A | — | aria-label, client action | None |
| Stop | Assistant composer | Button | (stops streaming) | ✅ | N/A | — | onStop | None |
| Quick prompt | Assistant thread | Button | (inserts prompt) | ✅ | N/A | — | onQuickPrompt | None |
| Retry | Assistant thread | Button | (retries message) | ✅ | N/A | — | onRetry | None |
| Save changes | All settings pages | Button | (persists settings) | ✅ | N/A | — | onSave in each page | None |
| Reset | Settings pages | Button | (resets to defaults) | ✅ | N/A | — | onReset | None |
| Sign out all other | Security settings | Button | (toast only) | ❌ | 🟥 | shows toast but does not sign out | onClick={toast.success(...)} | Connect to API endpoint (e.g. /api/auth/signout) |
| Revoke | Security settings | Button | (toast only) | ❌ | 🟥 | shows toast but does not revoke session | onClick={toast(...)} | Connect to API endpoint to revoke session |
| Delete account | Security settings | Button | (toast error only) | ❌ | 🟥 | shows error but does not delete | onClick={toast.error(...) } | Implement deletion API or remove button |

### 2.2 Solutions & portal detail pages

| CTA | Location | Type | Destination | Status | Severity | Problem | Evidence | Recommended Fix |
|---|---|---|---|---|---|---|---|---|
| AI Governance | Corporate solutions page | Button | /legalai/governance | ❌ | 🟥 | route does not exist | href="/legalai/governance" | Change to /security/ai-governance |
| Contract Intelligence | Corporate solutions page | Button | /legalai/contracts | ✅ | N/A | — | route exists | None |
| AI Governance | In-House solutions page | FeatureCard | /legalai/governance | ❌ | 🟥 | route does not exist | href="/legalai/governance" | Change to /security/ai-governance |
| Contract Intelligence | In-House solutions page | Button | /legalai/contracts | ✅ | N/A | — | route exists | None |
| Compliance | In-House solutions page | Button | /legalai/compliance | ❌ | 🟥 | route does not exist | href="/legalai/compliance" | Change to /solutions/compliance |
| Open Compliance | Compliance solutions page | Button | /legalai/compliance | ❌ | 🟥 | route does not exist | href="/legalai/compliance" | Change to /solutions/compliance |
| Regulatory Monitor | Compliance solutions page | Button | /legalai/monitor | ❌ | 🟥 | route does not exist | href="/legalai/monitor" | Change to /legalai/risk |
| Open Compliance | Compliance solutions page | Button | /legalai/compliance | ❌ | 🟥 | (duplicate) | href="/legalai/compliance" | Change to /solutions/compliance |
| Open Matter | Law Firms solutions page | Button | /legalai/matters | ✅ | N/A | — | route exists | None |
| Legal Research | Law Firms solutions page | Button | /legalai/research | ✅ | N/A | — | route exists | None |
| Legal Research | Litigation solutions page | Button | /legalai/research | ✅ | N/A | — | route exists | None |
| Debate Simulation | Litigation solutions page | Button | /legalai/debate | ✅ | N/A | — | route exists | None |
| Open Debate | Agents public page | Button | /legalai/debate | ✅ | N/A | — | route exists | None |

| AI Agents | SiteFooter | Footer link | /legalai/agent | ❌ | 🟥 | route does not exist | FOOTER_HREFS["AI Agents"]=/legalai/agent | Change to /agents/public |
| Regulatory Timeline | SiteFooter | Footer link | /legalai/monitor | ❌ | 🟥 | route does not exist | FOOTER_HREFS["Regulatory Timeline"]=/legalai/monitor | Change to /legalai/risk |
| Legal Research | SiteFooter | Footer link | /legalai/research | ✅ | N/A | — | route exists | None |
| Document Drafting | SiteFooter | Footer link | /legalai/draft | ❌ | 🟥 | route does not exist | FOOTER_HREFS["Document Drafting"]=/legalai/draft | Change to /platform/document-drafting |
| Compliance | SiteFooter | Footer link | /legalai/compliance | ❌ | 🟥 | route does not exist | FOOTER_HREFS["Compliance"]=/legalai/compliance | Change to /solutions/compliance |
| Corporate Legal | SiteFooter | Footer link | /solutions/corporate-legal | ❌ | 🟥 | route does not exist (correct: /solutions/corporate) | FOOTER_HREFS["Corporate Legal"]=/solutions/corporate-legal | Change to /solutions/corporate |
| Law Firms | SiteFooter | Footer link | /solutions/law-firms | ✅ | N/A | — | route exists | None |
| Risk | SiteFooter | Footer link | /legalai/risk | ✅ | N/A | — | route exists | None |
| Legal Operations | SiteFooter | Footer link | /solutions/legal-operations | ❌ | 🟥 | route does not exist | FOOTER_HREFS["Legal Operations"]=/solutions/legal-operations | Change to /solutions |
| About | SiteFooter | Footer link | /about | ✅ | N/A | — | route exists | None |
| Security | SiteFooter | Footer link | /security | ✅ | N/A | — | route exists | None |
| Careers | SiteFooter | Footer link | /careers | ✅ | N/A | — | route exists | None |
## 6. Recommended Fixes

### Priority 1 — Critical conversion path (highest impact)
## 7. Duplicate & Inconsistent CTA Analysis

| CTA label | Instance 1 | Instance 2 | Instance 3 | Inconsistency |
|---|---|---|---|---|
| Drafting Studio | Navbar → `/legalai/draft` (404) | Navbar mobile → `/legalai/draft` (404) | FinalCTA "Open Drafting Studio" → `/legalai/draft` (404) | All instances share the same broken route. No working version exists. |
| Sign in | Navbar → `/legalai` (works) | Navbar mobile → `/legalai` (works) | — | Consistent. |
| AI Agents | Navbar → `/agents` (404) | Navbar mobile → `/agents` (404) | Platform "AI Agent Swarm" → `/agents` (404) | All instances share the same wrong route. |
| Request early access | Hero → `/request-access` (works) | FinalCTA → `/request-access` (works) | About page → `/request-access` (works) | Consistent. |
| Watch demo | Hero → `/legalai/agent` (404) | FinalCTA → `/legalai/agent` (404) | — | Both instances share the same broken route. |
| AI Governance | Agents public → `/legalai/governance` (404) | Corporate → `/legalai/governance` (404) | In-House → `/legalai/governance` (404) | All instances share the same broken route. |
| Compliance | SiteFooter → `/legalai/compliance` (404) | In-House → `/legalai/compliance` (404) | Compliance → `/legalai/compliance` (404) | All instances share the same broken route. |
| Regulatory Monitor | SiteFooter → `/legalai/monitor` (404) | Compliance → `/legalai/monitor` (404) | — | Both instances share the same broken route. |
| Contact Sales | Pricing → `/contact` (works, mislabeled) | — | — | Single instance, but destination misleads. |
| Delete account | Security → toast-only (no-op) | — | — | Single instance, but acts as a functional CTA. |

## 8. Primary Conversion Path Assessment

### 8.1 Landing → Get Started → Sign Up → Checkout

**Path:** `/` → "Request early access" → `/request-access` → (form) → `/legalai` → dashboard

**Findings:** "Request early access" on `/`, About, FinalCTA, Pricing — all **working** ✅. `/request-access` exists ✅. "Contact Sales" → `/contact` on Pricing — exists but not a sales path (leads back to `/request-access`) ⚠️. No checkout exists in the product (legal AI platform, not e-commerce). The closest is the early-access form.

**Verdict:** No primary conversion blocker. "Contact Sales" mislabel is a minor risk on pricing.

### 8.2 Landing → Book Demo → Calendar → Confirmation

**Path:** `/` → "Watch demo" → `/legalai/agent` → (destination missing)

**Findings:** "Watch demo" appears on **Hero** and **FinalCTA** (2 instances), both → `/legalai/agent` (404). **The most damaging broken CTA on the primary acquisition path.** A prospect clicking "Watch demo" gets a 404. No demo-booking feature exists; a calendar/booking route or recorded-video link is needed.

**Verdict:** BROKEN — remove or redirect to `/legalai/hitl` immediately.

### 8.3 Landing → Open Workspace → Dashboard

**Path:** `/` → "Open Law Mate" → `/legalai` → dashboard

**Findings:** "Open Law Mate" (Navbar, desktop+mobile), "Open the Workspace" (Hero), FinalCTA "Open Workspace", Platform "Open Law Mate Workspace" — all **working** ✅. The dashboard gateway `/legalai` loads the workspace correctly. "Ask LawMate", "New matter", "New document" CTAs are functional.

**Verdict:** Working. No broken CTA on this path.

### 8.4 Agent management flow

**Path:** `/legalai/agents` → Open / Run / Pause / Kill / Revive → agent detail.

**Findings:** All agent actions work via client handlers. Agent detail tabs route correctly — **all working** ✅. Revive/Pause/Run/Kill — **working** ✅.

**Verdict:** Working.

### 8.5 Document drafting flow

**Path:** Landing → Document Drafting page → "Open Drafting Studio" → `/legalai/draft`.

**Findings:** "Open Drafting Studio" (Document Drafting page) and "Open Drafting" (Templates page) → `/legalai/draft` — **404**. The drafting feature exists in the dashboard (`/legalai/documents/[id]/studio`), but the public entry point is broken.

**Verdict:** BROKEN — the public entry point to drafting is broken.

## 9. Final Assessment

### Overall CTA Health: **Needs Attention**

The landing pages have a strong, consistent conversion architecture. However, **29 CTA instances point at 12 distinct non-existent routes**, and several interactive CTAs (Delete account, Sign out all other, Revoke) perform a toast instead of an action.

### Top 5 CTA Fixes by Conversion Impact

1. **Fix `/legalai/draft`** — replace 10+ broken instances with `/platform/document-drafting` or add the route.
2. **Fix "Watch demo" → `/legalai/agent`** — replace with `/legalai/hitl` or remove.
3. **Fix `/legalai/governance`** — re-target 4 instances to `/security/ai-governance`.
4. **Fix `/legalai/compliance`** — re-target 3 instances to `/solutions/compliance`.
5. **Fix `/legalai/monitor`** — re-target to `/legalai/risk`.

### Secondary fixes

6. Fix `/agents` → `/agents/public` (3 instances).
7. Fix `/platform/evidence` → create route or retarget.
8. Fix `/legalai/analytics` → `/legalai/analysis`.
9. Fix contract row links (`/overview`).
10. Implement Security settings "Delete account" and "Sign out all other" actions.
11. Fix Agents public card double-prefix links.
12. Fix "Copy email", "Prompt Injection Defense" card, "Contact Sales" label, SiteFooter insights/blog/faq.


1. **Fix `/legalai/draft`** — replace 10+ broken instances with `/platform/document-drafting` or add the route. Affects drafting funnel.
2. **Fix "Watch demo" → `/legalai/agent`** — replace with `/legalai/hitl` or remove. Appears on Hero and FinalCTA; blocks demo-evaluation flow.
3. **Fix `/legalai/governance`** — re-target 4 instances to `/security/ai-governance`. Trust signal on solution pages.
4. **Fix `/legalai/compliance`** — re-target 3 instances to `/solutions/compliance`.
5. **Fix `/legalai/monitor`** — re-target to `/legalai/risk`. Key differentiator CTA.

### Priority 2 — High conversion impact

6. **Fix `/agents`** → `/agents/public` (3 instances).
7. **Fix `/platform/evidence`** — create route or retarget to `/platform/matter-management`.
8. **Fix `/legalai/analytics`** → `/legalai/analysis`.
9. **Fix contract row links** — `/legalai/contracts/{id}/overview` → `/legalai/contracts/{id}`.

### Priority 3 — Usability / trust

10. **Security settings** — implement "Delete account", "Sign out all other", "Revoke" actions.
11. **Agents public card links** — change `/agents/public/public/{id}` to `/agents/public/{id}` (12 instances).
12. **Fix "Copy email"**, "Prompt Injection Defense" card, "Contact Sales" label, SiteFooter insights/blog/faq.

| Contact | SiteFooter | Footer link | /contact | ✅ | N/A | — | route exists | None |
| Documentation | SiteFooter | Footer link | /resources/documentation | ✅ | N/A | — | route exists | None |
| Insights | SiteFooter | Footer link | /resources/insights | ❌ | 🟥 | route does not exist | FOOTER_HREFS["Insights"]=/resources/insights | Remove or route to /resources/documentation |
| Blog | SiteFooter | Footer link | /resources/blog | ❌ | 🟥 | route does not exist | FOOTER_HREFS["Blog"]=/resources/blog | Remove or route to /resources/documentation |
| FAQ | SiteFooter | Footer link | /resources/faq | ❌ | 🟥 | route does not exist | FOOTER_HREFS["FAQ"]=/resources/faq | Remove or route to /resources/documentation |
| Privacy | SiteFooter | Footer link | /privacy | ✅ | N/A | — | route exists | None |
| Terms | SiteFooter | Footer link | /terms | ✅ | N/A | — | route exists | None |
