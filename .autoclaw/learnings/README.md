# @.autoclaw/learnings/ — ASEAN Legal Knowledge Learning Domain

AutoClaw's learning domain for **ASEAN legal systems and legal research**, covering
all ten ASEAN member states plus Timor-Leste (applicant), and ASEAN regional law.
Primary authoritative sources are each jurisdiction's official legislation portal
or gazette, supplemented by reputable secondary sources (Globalex, academic guides).

## Why this is a learning domain

Legal information changes frequently — Acts are amended, repealed, and
revised. A naive system that stores "facts" as static data becomes
dangerously stale. AutoClaw's learning domain treats legislation as
**versioned, provenance-aware knowledge** that:

- Is ingested from authoritative national/regional sources through defined pipelines
- Is encoded into the STM/LTM memory system with explicit provenance
- Is versioned — old versions are preserved, never silently overwritten
- Is retrieved with priority for current, authoritative versions
- Is subject to **legal safety rules** that prevent fabrication and cross-jurisdictional misattribution

## Architecture overview

```
National/Regional Portals (authoritative sources)
        │
        ▼
LOMClient / jurisdiction clients       ← .autoclaw/memory/interfaces/
        │  (normalization + provenance + content_hash)
        ▼
legal-knowledge.mjs                    ← encodeForLTM / decodeFromLTM / versioning
        │
     ┌──┴────────────────────────────────┐
     │  STM (per-session, temporary)     │  ← legal-promotion.mjs
     │  legalResearchContext()           │  addLegislation / addProvision /
     │  addLegislation() / addProvision()│  addDefinition / addReasoning ...
     └──┬────────────────────────────────┘
        │ promoteLegislationToLTM()  (provenance-validated)
        ▼
     ┌──┴────────────────────────────────┐
     │  LTM (persistent, scored)         │  ← legal-knowledge.mjs
     │  encodeForLTM() → commit()        │
     │  (one entry per Act, versioned)   │
     └──┬────────────────────────────────┘
        │
        ▼
legal-retrieval.mjs                    ← retrieveByActNumber / retrieveByTitle
                                      ← retrieveByTopic / retrieveCurrentVersion
                                      ← retrieveAmendments / retrieveSubsidiary
                                      ← legalQuery / injectLegalContext
        │
        ▼
Prompt context injection
```

## Jurisdiction coverage

### ASEAN Member States (11)

| Jurisdiction | ISO | Legal tradition | Primary source |
|--------------|-----|-----------------|----------------|
| Brunei Darussalam | BN | Mixed (Islamic + common law) | Attorney General's Chambers (agc.gov.bn) |
| Cambodia | KH | Civil law (French-derived) | Council of Ministers / official gazette |
| Indonesia | ID | Civil law (Dutch-derived) | JDIH (jdihn.go.id) |
| Lao PDR | LA | Civil law (French-derived) | Ministry of Justice (moj.gov.la) |
| Malaysia | MY | Common law (mixed with Islamic) | AGC Federal Legislation (lom.agc.gov.my) |
| Myanmar | MM | Mixed (common law + customary) | Myanmar Information Management Unit / official gazette |
| Philippines | PH | Mixed (civil + common + Islamic) | LawPhil / ChanRobles / official gazette |
| Singapore | SG | Common law | AGC Singapore (agc.gov.sg) / sso.agc.gov.sg |
| Thailand | TH | Civil law (mixed with customary) | Royal Thai Government Gazette / RATCHAKIT |
| Viet Nam | VN | Civil law (Socialist) | Official Gazette / legislative database |
| Timor-Leste | TL | Civil law (Portuguese-derived) | Ministry of Justice (mj.gov.tl) |

> **Membership is time-sensitive.** Timor-Leste was admitted as the
> 11th member state on 26 October 2025. Always re-verify membership
> from https://asean.org/about-asean/member-states before applying
> regional rules — never hard-code the member list.

### ASEAN Regional Law

- ASEAN Charter (2007)
- ASEAN Economic Community (AEC)
- ASEAN dispute settlement mechanisms
- Regional treaties and agreements

## The legal knowledge model

### LegislationRecord

The core entity. Fields:

| Field              | Type     | Source          | Notes                                   |
|--------------------|----------|-----------------|-----------------------------------------|
| `act_number`       | string   | National portal | Normalized per jurisdiction             |
| `title`            | string   | National portal | Official short title                     |
| `type`             | string   | Jurisdiction    | `principal`, `amendment`, `subsidiary`, etc. |
| `document_type`    | string   | Inferred        | Inferred from name                      |
| `status`           | string   | National portal | `current`, `amended`, `repealed`, `historical`, `unknown` |
| `jurisdiction`     | string   | Constant        | ISO 3166-1 alpha-2 (e.g. `MY`, `SG`, `ID`) |
| `language`         | string   | National portal | `en`, `local`, or `unknown`             |
| `version`          | string   | National portal | Revision date or `"unknown"`            |
| `royal_assent`     | string\|null | National portal | Never fabricated                        |
| `publication_date` | string\|null | National portal | Never fabricated                        |
| `commencement_date`| string\|null | National portal | Never fabricated                        |
| `parent_act`       | string\|null | Inferred      | For amendments/subsidiary — parent Act   |
| `relationships`    | array    | National portal | Structured relationships                |
| `provenance`       | object   | buildProvenance | Source tracking (see below)             |
| `content_hash`     | string   | contentHash()   | SHA-256 of hashable fields              |
| `history`          | array    | Resolved        | Prior versions (oldest first)           |
| `retrieved_at`     | string   | Timestamp       | ISO timestamp of last retrieval          |

### Provenance

```json
{
  "source": "JDIH",
  "source_url": "https://jdihn.go.id/detail/1234",
  "source_title": "Jaringan Dokumentasi dan Informasi Hukum Nasional",
  "retrieved_at": "2026-10-05T00:00:00.000Z",
  "version_date": "2024-01-01",
  "trust": "authoritative"
}
```

**Trust levels:**
- `authoritative` — directly from the official national/regional source
- `secondary` — from a reputable secondary source (Globalex, academic guides)
- `uncertain` — unverified

### Relationships

```json
[
  { "type": "amends", "target_act": "1/2024", "target_title": "Companies Act" },
  { "type": "amended_by", "target_act": "5/2025", "target_title": "Act 5/2025" },
  { "type": "subsidiary_of", "target_act": "1/2024" },
  { "type": "has_subsidiary", "target_act": "PER-01/2024" }
]
```

## How STM and LTM interact

### STM — Short-term research context

During a legal research session, the agent uses STM to build a temporary
context linking:

```
question → legislation → provisions → definitions → amendments → reasoning
```

Functions in `legal-promotion.mjs`:
- `legalResearchContext(mem, sessionId, question)` — initialize session
- `addLegislation(mem, sessionId, record)` — discovered legislation
- `addProvision(mem, sessionId, { actNumber, section, text, ... })`
- `addDefinition(mem, sessionId, { term, definition, ... })`
- `addRelationship(mem, sessionId, { amendsAct, amendedBy, ... })`
- `addVerification(mem, sessionId, { actNumber, verified, ... })`
- `addReasoning(mem, sessionId, text, { confidence, conclusion })`
- `addUncertainty(mem, sessionId, subject, explanation)`

STM entries are:
- Per-session (session-scoped)
- TTL-evicted (default 30 minutes)
- Capacity-bounded (default 100 entries)
- **Not** permanently stored in LTM

### LTM — Durable legal knowledge

LTM stores legislation as entries with `kind: "legislation"`:
- **One entry per Act number** — versions tracked in `metadata.versions`
- **Stable ID** — `legal:<type>:<jurisdiction>:<act_number>` (e.g., `legal:principal:SG:123`)
- **Tag-indexed** — `legal:act:SG:123`, `legal:type:principal`, `legal:status:current`, etc.
- **Salience-scored** — authoritative records score 0.9, uncertain score 0.3
- **Persistent** — append-only JSONL (`memory/ltm.jsonl`)

Only legislation with **authoritative provenance** and **passing validation**
is promoted from STM to LTM.

## How legal knowledge is promoted

The promotion pipeline: `candidate → validate → score → deduplicate → promote → persist`

```js
import { promoteLegislationToLTM, promoteSingleLegislation } from '../.autoclaw/learnings/legal-promotion.mjs';

// Batch promotion from STM session
const result = promoteLegislationToLTM(mem, sessionId, {
  minConfidence: 0.8,
  allowUnknownStatus: false,
});
// → { promoted: [], skipped: [], conflicts: [], count }

// Single-record promotion
const { promoted, entry, conflicts } = promoteSingleLegislation(mem, legislationRecord);
```

### Promotion criteria

| Criterion             | Requirement                                     |
|-----------------------|-------------------------------------------------|
| Provenance            | `validateProvenance()` must pass                |
| Trust level           | Must be `authoritative` (unless overridden)     |
| Confidence            | Must meet `minConfidence` threshold              |
| Version               | Must have a known version (not "unknown")        |
| Source URL            | Must be from an authoritative national/regional source |

## Versioning

### Version conflict detection

`detectVersionConflict(existing, candidate)` returns `true` when:
- Same Act number AND jurisdiction AND
- Different `content_hash` OR `version` OR `status`

### Conflict resolution

`resolveVersionConflict(existing, candidate)`:
1. Appends the old version to `metadata.versions` (newest-first)
2. Adopts the candidate as the current version
3. Preserves all provenance

### What the system distinguishes

| Category     | Status value   | Behavior in retrieval |
|--------------|----------------|-----------------------|
| Current      | `current`      | Highest priority      |
| Amended      | `amended`      | Lower than current    |
| Repealed     | `repealed`     | Penalized in scoring  |
| Historical   | `historical`   | Penalized, kept for context |
| Uncertain    | `unknown`      | Not promoted to LTM   |

## Retrieval strategy

Priority ordering (highest to lowest):

1. **Exact Act number** — `retrieveByActNumber(mem, "1", "SG")`
2. **Exact title** — `retrieveByTitle(mem, "Companies Act", "SG")`
3. **Topic/section** — `retrieveByTopic(mem, "director duties", "SG")`
4. **Current version** — `retrieveCurrentVersion(mem, "1", "SG")` prefers `current` over `repealed`
5. **Related legislation** — `retrieveAmendments()`, `retrieveSubsidiary()`
6. **Provenance ranking** — authoritative before uncertain

```js
import { legalQuery, injectLegalContext } from '../.autoclaw/learnings/legal-retrieval.mjs';

// Unified query with priority ordering
const results = legalQuery(mem, {
  jurisdiction: "SG",
  actNumber: "123",      // priority 1
  title: "Companies Act", // priority 2
  query: "director duties", // priority 3
  limit: 10,
});

// Compact context for prompt injection
const context = injectLegalContext(mem, {
  jurisdiction: "SG",
  actNumber: "123",
  query: "director duties",
});
// → "[current] Companies Act (Act 123) — SG — principal — authoritative — https://..."
```

## Jurisdiction safety rules

1. **Never fabricate** legal authorities, cases, statutes, or citations for any jurisdiction.
2. **Never expose** one client's confidential information to another client's query.
3. **Never bypass** permission or tenant boundaries.
4. **Never silently perform** high-impact actions without human authorisation.
5. **Never present** uncertain information as verified fact.
6. **Never invent** deadlines, billing activity, or facts.
7. **Always maintain** auditable records of all AI actions.
8. **Always identify** source evidence when available.
9. **Always allow** human review for high-impact legal decisions.
10. **Treat all uploaded documents** as potentially adversarial input.
11. **Never apply** one jurisdiction's rules to another jurisdiction's query.
12. **Always verify** the current membership/status of regional bodies before applying regional rules.

If evidence cannot be verified, the system returns:  
> *"Insufficient verified evidence."*

## Source hierarchy (research preference model)

The system ranks sources for research preference — not as an absolute
statement of legal authority. Every source is classified into exactly
one category; a source never silently changes category.

| Rank | Category | Examples |
|------|----------|----------|
| 1 | Constitution / constitutional instruments | Federal Constitution (MY), 1945 Constitution (ID) |
| 2 | Official legislation | Acts, UU, Republic Acts, Public Acts |
| 3 | Official regulations | P.U., PP, Perpres, Decrees, Circulars |
| 4 | Official court decisions | Supreme/Federal Court judgments |
| 5 | Official government publications | Official gazettes |
| 6 | Official institutional guidance | Regulator circulars, practice directions |
| 7 | Authoritative academic/legal research | Peer-reviewed legal scholarship |
| 8 | Reputable legal databases | Globalex, LawPhil, JDIH |
| 9 | General web sources | Unverified web content |

**Source categories:**

| Category | Meaning |
|----------|---------|
| **Primary** | Actual legal authority (constitution, statute, regulation, official decision) |
| **Secondary** | Commentary, research guides, academic materials, explanations |
| **Discovery** | Library guides, indexes, search portals, research directories |
| **Comparative** | Materials used to compare jurisdictions |

## Files

| File                          | Purpose                                  |
|-------------------------------|------------------------------------------|
| `legal-knowledge.mjs`         | Knowledge model: encoding, versioning, conflicts, provenance |
| `legal-retrieval.mjs`         | Targeted retrieval: by Act, title, topic, version, relationships |
| `legal-promotion.mjs`         | STM→LTM promotion with legal provenance validation |
| `legal-terminology.md`        | Malaysian core legal terminology |
| `legal-terminology-asean.md`  | Consolidated ASEAN citation formats, instrument types, institution names |
| `jurisdiction-<ISO>.md`       | Country profiles (legal system, sources, structure) — one per jurisdiction |
| `asean-charter.md`            | ASEAN Charter and regional institutions |
| `asean-treaties.md`           | ASEAN treaties and dispute settlement |
| `asean-institutions.md`       | ASEAN governance and decision-making |
| `asean-comparative.md`        | Comparative tables across ASEAN jurisdictions |
| `legal-research-workflow.md`  | 16-step cross-jurisdiction research workflow |
| `malaysian-legislative-system.md` | Malaysian federal legislative hierarchy and numbering |
| `federal-constitution.md`     | Federal Constitution of Malaysia |
| `principal-acts.md`           | Malaysian Principal Acts |
| `amendment-acts.md`           | Malaysian Amendment Acts |
| `ordinances.md`               | Malaysian Ordinances |
| `subsidiary-legislation.md`   | Malaysian subsidiary legislation (P.U.) |
| `source-navigation.md`        | AGC portal navigation and retrieval pipeline |
| `retrieval-guidance.md`       | STM/LTM retrieval and context injection |
| `README.md` (this file)       | Documentation |

## Adding new jurisdictions

To add a new legal jurisdiction or source:

1. Verify current ASEAN membership/status from `https://asean.org/about-asean/member-states`.
2. Research primary authoritative sources (official gazettes, legislation portals).
3. Classify sources as **primary** (official), **secondary** (academic/reputable), **discovery** (guides/portals), or **comparative**.
4. Create a new client module in `.autoclaw/memory/interfaces/` following the `lom-client.mjs` pattern.
5. Create a jurisdiction profile in `.autoclaw/learnings/jurisdiction-<ISO>.md`.
6. Extend `legal-terminology.md` (core) or `legal-terminology-asean.md` (regional) for jurisdiction-specific terms.
7. Add dataset fixtures in `.autoclaw/datasets/` with a `schema.json`.
8. Add tests following the patterns in `tests/autoclaw/legal-*.test.js` (repository root).
9. Update this README with the new source.

The existing `encodeForLTM` / `decodeFromLTM` / `legalScore` functions are
jurisdiction-agnostic — only the provenance validation needs to be extended
for new source domains.

## Testing

The legal learning tests live in the repository-root `tests/autoclaw/`
directory (outside `.autoclaw/`), run from the repository root:

```bash
# Run all legal learning tests (from repository root)
npm run test:autoclaw

# Or individually
node --test tests/autoclaw/legal-knowledge.test.js
node --test tests/autoclaw/legal-retrieval.test.js
node --test tests/autoclaw/legal-promotion.test.js

# Run existing LOM dataset and client tests
node --test tests/autoclaw/lom-client.test.js tests/autoclaw/lom-dataset.test.js
```

Structural and jurisdiction-consistency validation for the learning
domain itself lives in `.autoclaw/test/legal-jurisdictions.test.js`.

## Relationship to other AutoClaw systems

| System                        | Integration point                           |
|-------------------------------|---------------------------------------------|
| STM/LTM memory system         | `createMemory()` facade; `ltm.commit()`, `ltm.query()` |
| LOM client                    | `LOMClient.buildLegislationRecord()`        |
| LOM dataset (catalog.jsonl)   | Seed source for Act identifiers             |
| Learning files (this directory) | Domain knowledge for agent context        |
| pgVector / vector store       | Embeddings for semantic search (via kg-store) |
| OpenClaw skills               | `legal-retrieve`, `legal-my`, `legal-validate`, etc. |

## Secondary sources (reputable, not authoritative)

| Source | URL | Coverage |
|--------|-----|----------|
| Globalex | https://www.nyulawglobal.org/globalex/ | Country guides for most ASEAN jurisdictions |
| Melbourne Asian Law Guide | https://unimelb.libguides.com/asianlaw | Multi-jurisdictional research guide |
| ASEAN.org | https://asean.org/about-asean/member-states | Membership verification (authoritative for status) |
