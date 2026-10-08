---
id: learning-legal-research-workflow
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:ASEAN, workflow, retrieval, methodology, secondary]
promoted: true
source: https://www.nyulawglobal.org/globalex/, https://asean.org/
provenance: secondary
---

# ASEAN Legal Research Workflow

## Identity

- **Document type:** Methodology / workflow
- **Coverage:** Cross-jurisdiction ASEAN legal research
- **Sources:** Globalex country guides, ASEAN official sources, Melbourne Asian Law guide
- **Trust level:** Secondary (methodology guidance, not legal authority)

## Purpose

This workflow provides a **standardized 16-step process** for conducting
cross-jurisdiction legal research across ASEAN member states and applicant
states. It ensures:
- Systematic coverage of each jurisdiction's unique legal system
- Proper source attribution and provenance tracking
- Compliance with safety rules (no fabrication, no cross-jurisdiction misattribution)
- Efficient retrieval and verification

## When to use this workflow

Use this workflow for:
- Multi-jurisdiction legal analysis
- ASEAN regional law questions
- Comparative law questions
- International legal research involving ASEAN states

**Do NOT use this workflow** for single-jurisdiction deep-dive research where
a country-specific retrieval path (e.g., `legalQuery` with `jurisdiction: "MY"`)
is sufficient.

## The 16-step workflow

### Step 1: Identify jurisdiction and verify ASEAN membership status

- Determine the ISO 3166-1 alpha-2 code for the target jurisdiction
- Verify ASEAN membership status from **https://asean.org/about-asean/member-states**
- For applicant states (e.g., Timor-Leste), confirm current status
- Do NOT assume membership based on geography or prior knowledge
- Document: `jurisdiction`, `asean_membership_status`, `verification_date`

### Step 2: Determine applicable legal system

- Identify the legal tradition: common law, civil law, mixed, or socialist
- Note layered influences (e.g., Islamic law, customary law, socialist law)
- Consult country profile (`jurisdiction-<ISO>.md`) for system overview
- Document: `legal_tradition`, `layered_systems`, `country_profile_ref`

### Step 3: Identify primary source portal

- Locate the official legislation portal or gazette for the jurisdiction
- Consult `asean-comparative.md` for quick reference
- Consult country profile for detailed portal structure
- Classify as **primary** (official) or **secondary** (reputable mirror)
- Document: `primary_source_url`, `portal_type`, `access_notes`

### Step 4: Search for legislation by Act/law number or title

- Use exact Act/law number if known
- Use exact title if known
- Use topic keywords if specific provision is needed
- Query `legalQuery` with `jurisdiction`, `actNumber`, and/or `query`
- Document: `search_terms`, `retrieval_method`

### Step 5: Verify currency (current vs. amended vs. repealed)

- Check `status` field: `current`, `amended`, `repealed`, `historical`
- Retrieve current version if multiple versions exist
- Use `retrieveCurrentVersion(mem, actNumber, jurisdiction)`
- Document: `status`, `version_date`, `current_version_ref`

### Step 6: Retrieve official text or authorized translation

- Retrieve the full text or relevant provisions
- Verify language of the retrieved text
- For bilingual jurisdictions, identify which language is authoritative
- If only a translation is available, mark as secondary
- Document: `retrieved_text_language`, `authoritative_language`, `translation_flag`

### Step 7: Cross-reference with secondary sources

- Consult Globalex country guide for access procedures and caveats
- Consult Melbourne Asian Law guide for comparative context
- Cross-reference with academic articles or practitioner guides
- Mark secondary sources with `trust: "secondary"`
- Document: `secondary_sources_consulted`, `cross_reference_notes`

### Step 8: Check for ASEAN treaty obligations

- Determine if ASEAN treaties apply (only for member states)
- Search ASEAN Charter, ASEAN treaties, and agreements
- Verify domestic implementing legislation
- For applicant states, do NOT apply ASEAN obligations unless ratified
- Document: `asean_treaties_checked`, `implementing_legislation_found`

### Step 9: Verify domestic implementing legislation

- ASEAN agreements require domestic incorporation in most member states
- Search for implementing Acts, regulations, or decrees
- Verify that the implementing measure is in force
- Document: `implementing_acts`, `implementation_status`

### Step 10: Validate citation format per jurisdiction

- Apply jurisdiction-specific citation conventions:
  - MY: `Act 884` / `Act A1234` / `P.U. (A) 123`
  - PH: `Republic Act No. XXXX` / `BP Blg. X`
  - ID: `UU No. X Tahun YYYY`
  - TH: `P.A. No. X` / `R.D. No. X`
  - VN: `Law No. XX/YYYY-CP`
  - KH: `NS/RKM/XXXX/YY`
- Ensure citations do not mix conventions across jurisdictions
- Document: `citation_format_used`

### Step 11: Assess evidentiary weight

- Assign trust level:
  - `authoritative` — directly from official portal/gazette
  - `secondary` — from reputable secondary source
  - `uncertain` — unverified or from unreliable source
- Salience scoring: authoritative = 0.9, secondary = 0.5, uncertain = 0.3
- Document: `trust_level`, `salience_score`, `provenance`

### Step 12: Flag bilingual/multilingual considerations

- Identify official language(s) of legislation
- Determine which language version is authoritative
- Flag if only translation is available
- Note regional language variations (e.g., Malay in Sabah/Sarawak)
- Document: `primary_language`, `authoritative_version`, `translation_flag`

### Step 13: Check for customary/religious law overlay

- Identify if customary law (Adat, Tara Bandu) or religious law (Syariah,
  Hindu/Buddhist influences) applies
- Determine which courts have jurisdiction (e.g., Syariah Court)
- Note when national law and customary/religious law may conflict
- Document: `customary_law_flag`, `religious_law_flag`, `applicable_courts`

### Step 14: Verify court structure and precedent system

- Identify the court hierarchy
- Determine whether the jurisdiction is common law (precedent binding) or
  civil law (codes primary, precedent persuasive)
- Identify highest appellate court
- Note specialized courts (constitutional, administrative, military)
- Document: `court_structure`, `precedent_system`, `highest_court`

### Step 15: Document provenance

- Record full provenance object:
  - `source`: e.g., "LOM", "JDIH", "RATCHAKIT"
  - `source_url`: direct URL to the document
  - `source_title`: name of the source
  - `retrieved_at`: ISO timestamp
  - `version_date`: version or publication date
  - `trust`: `authoritative` / `secondary` / `uncertain`
- Never fabricate any provenance field
- Document: `provenance_object`

### Step 16: Distinguish retrieval from legal advice

- Explicitly state: "Retrieved from [source] — not legal advice"
- When interpretation is uncertain, state the uncertainty
- Never fabricate legal conclusions
- If evidence cannot be verified, return: `"Insufficient verified evidence."`
- Document: `disclaimer_statement`, `uncertainty_flag`

## Error handling

| Error condition | Action |
|-----------------|--------|
| Portal unreachable | Return `status: "unknown"`, `trust: "uncertain"` |
| Act not found | Mark as `unknown`, do not store fabricated metadata |
| Conflicting sources | Store both versions with respective provenance; flag conflict |
| ASEAN membership uncertain | Verify from asean.org before proceeding |
| Translation only available | Mark as `trust: "secondary"`, note authoritative language |
| Customary law conflict | Flag both national and customary sources; note conflict |

## Workflow checklist (compact)

```
[ ] 1. Jurisdiction identified; ASEAN status verified
[ ] 2. Legal system determined (civil / common / mixed / socialist)
[ ] 3. Primary source portal identified
[ ] 4. Legislation searched by number/title/topic
[ ] 5. Currency verified (current / amended / repealed)
[ ] 6. Official text or authorized translation retrieved
[ ] 7. Cross-referenced with secondary sources
[ ] 8. ASEAN treaty obligations checked
[ ] 9. Domestic implementing legislation verified
[ ] 10. Citation format validated per jurisdiction
[ ] 11. Evidentiary weight assessed (trust level)
[ ] 12. Bilingual/multilingual considerations flagged
[ ] 13. Customary/religious law overlay checked
[ ] 14. Court structure and precedent system verified
[ ] 15. Provenance documented
[ ] 16. Retrieval vs. legal advice boundary maintained
```

## Integration with retrieval functions

```js
import { legalQuery, injectLegalContext } from '../.autoclaw/learnings/legal-retrieval.mjs';
import { createMemory } from '../.autoclaw/memory/index.js';
import { legalResearchContext, addLegislation, addProvision, addReasoning } from '../.autoclaw/learnings/legal-promotion.mjs';

const mem = createMemory({ root: process.cwd() });

// 1. Identify jurisdiction
const jurisdiction = "SG";
const sessionId = `research-${Date.now()}`;

// 2. Initialize research context
legalResearchContext(mem, sessionId, "Singapore director duties under Companies Act");

// 3. Search
const results = legalQuery(mem, {
  jurisdiction,
  actNumber: "36",
  query: "director duties",
  limit: 10,
});

// 4. Add discovered legislation
results.forEach(r => addLegislation(mem, sessionId, r.record, { verified: true, confidence: 0.9 }));

// 5. Add provisions
// ...

// 6. Record reasoning
addReasoning(mem, sessionId, "Singapore Companies Act imposes fiduciary duties on directors under common law principles.", {
  confidence: 0.85,
  conclusion: "Directors owe fiduciary duties.",
});
```

## Legal safety boundary

This is a **methodology document** for research guidance. It does not
constitute legal authority. Always verify facts against primary sources.
When evidence cannot be verified, the system returns:  
> *"Insufficient verified evidence."*
