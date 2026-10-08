---
id: learning-source-navigation
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, retrieval, source-navigation, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# AGC Portal Source Navigation & Retrieval Procedures

## Authoritative source

**Attorney General's Chambers Malaysia — Federal Legislation:**
`https://lom.agc.gov.my/`

All legislation metadata in the AutoClaw learning system must be traceable
to this source. Never treat search snippets or secondary summaries as
authoritative legal facts (§9, §12).

## Portal structure

The AGC portal (`lom.agc.gov.my`) organizes legislation into sections:

```
https://lom.agc.gov.my/
├── constitution/          → Federal Constitution
├── akta/                  → Principal Acts + Amendment Acts
│   ├── Act 884.pdf        → Companies Act 2016 (revised)
│   └── Act A1234.pdf      → Amendment Act
├── pu/                    → Subsidiary legislation (P.U. (A), P.U. (B))
│   ├── pu-a/              → P.U. (A) listings
│   └── pu-b/              → P.U. (B) listings
├── ordinance/             → State Ordinances
└── search                 → Full-text search across all sections
```

## URL patterns for legislation

| Document type        | URL pattern                                          |
|----------------------|------------------------------------------------------|
| Principal Act        | `https://lom.agc.gov.my/akta/Act%20<number>.pdf`     |
| Amendment Act        | `https://lom.agc.gov.my/akta/Act%20A<number>.pdf`    |
| P.U. (A)             | `https://lom.agc.gov.my/pu/pua/Act%20<a><number>.pdf`|
| P.U. (B)             | `https://lom.agc.gov.my/pu/pub/Act%20<b><number>.pdf`|
| Ordinance            | `https://lom.agc.gov.my/ordinance/...`               |
| Constitution         | `https://lom.agc.gov.my/constitution/`               |

These patterns are encoded in `lom-client.mjs`:
- `buildLegislationPdfUrl(actNumber)` — constructs the PDF URL
- `buildLegislationPageUrl(actNumber)` — constructs the HTML page URL
- `BASE_URL = "https://www.lom.agc.gov.my"`

## Retrieval procedure (§10 pipeline)

The learning pipeline follows:

```
official source → ingestion → normalization → metadata extraction
→ STM → validation/provenance → LTM → retrieval → context injection
```

### Step 1: Ingestion

Start from the AGC portal. The seed catalogue at
`.autoclaw/datasets/lom/catalog.jsonl` contains verified Act identifiers
obtained from the portal. Each record includes:

```json
{
  "id": "884",
  "act_number": "884",
  "type": "principal",
  "status": "unknown",           ← never fabricated
  "source": "LOM",
  "retrieved_at": "2026-01-01T00:00:00.000Z",
  "provenance": {
    "source": "LOM",
    "source_url": "https://lom.agc.gov.my/ilims/upload/portal/akta/outputaktap/Act%20884.pdf"
  },
  "royal_assent": null,          ← never fabricated
  "publication_date": null,
  "commencement_date": null
}
```

### Step 2: Normalization

Use `LOMClient.buildLegislationRecord(data)` to create a full record with:

- `content_hash` — SHA-256 hash of hashable fields for change detection
- `provenance` — structured source tracking (source, source_url, retrieved_at, trust)
- `version` — revision date (when available from the portal)
- `jurisdiction`, `language`, `relationships`, `history`

### Step 3: STM research context

During a research session, use `legalResearchContext()` to initialize STM,
then `addLegislation()`, `addProvision()`, `addDefinition()`, etc. to build
a temporary context linking:

```
user question → legislation → provisions → definitions → amendments → reasoning
```

### Step 4: Provenance validation before LTM promotion

Use `validateProvenance(record)` to check that:

- `act_number` is present
- `title` is present
- `provenance.source_url` exists and is from the AGC domain
- `provenance.retrieved_at` exists
- `provenance.source` exists
- No fabricated dates (temporal fields must be string or null)
- If `status` is set, `version` must not be "unknown"

Only records passing validation with `trust: "authoritative"` are promoted
to LTM via `promoteLegislationToLTM()` or `promoteSingleLegislation()`.

### Step 5: LTM storage with versioning

Use `encodeForLTM(record)` to convert a legislation record into an LTM entry:

- **ID:** `legal:<type>:<act_number>` (stable per Act)
- **Kind:** `legislation` (the LTM KIND for legal knowledge)
- **Text:** Human-readable summary for text search
- **Tags:** `legal`, `legal:act:<num>`, `legal:type:<type>`, etc.
- **Metadata:** Full record + version history + provenance

### Version updates (§7, §13)

When legislation changes:

1. `detectVersionConflict(existing, candidate)` — compares `content_hash`,
   `version`, and `status`
2. If conflict detected, `resolveVersionConflict(existing, candidate)`
   appends the old version to `history` and adopts the candidate
3. The updated entry is committed to LTM (same ID, updated content)
4. Old versions are preserved in `metadata.versions`

### Step 6: Retrieval (§8)

Use the legal retrieval functions:

| Function                  | Priority | Use case                         |
|---------------------------|----------|----------------------------------|
| `retrieveByActNumber()`   | 1 (highest)| Exact Act number match          |
| `retrieveByTitle()`       | 2        | Exact or fuzzy title match       |
| `retrieveByTopic()`       | 3        | Keyword/topic search             |
| `retrieveCurrentVersion()`| 4        | Latest active version            |
| `retrieveAmendments()`    | 5        | Amendments to an Act             |
| `retrieveSubsidiary()`    | 5        | P.U./subsidiary under an Act     |
| `legalQuery()`           | —        | Unified query with priority sort |
| `injectLegalContext()`   | —        | Compact context for prompts      |

## Error handling

- If the AGC portal cannot be reached: return `status: "unknown"` with
  `provenance.trust: "uncertain"`. Never fall back to secondary sources
  without marking them as such.
- If an Act number cannot be found on the portal: mark as `unknown` status
  and do not store fabricated metadata.
- If a conflict cannot be resolved (e.g., two authoritative sources disagree):
  store both versions with their respective provenance and flag the conflict.

## See also (ASEAN cross-jurisdiction)

- `jurisdiction-MY.md` — Malaysia country profile
- `asean-comparative.md` — Official gazettes and databases for all ASEAN jurisdictions
- `legal-research-workflow.md` — Cross-jurisdiction source validation methodology
