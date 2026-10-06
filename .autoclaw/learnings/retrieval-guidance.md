---
id: learning-retrieval-guidance
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, retrieval, guidance]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# AutoClaw Legal Retrieval & Context Injection

## Overview

The AutoClaw legal learning system provides targeted retrieval of Malaysian
federal legislation through its STM/LTM memory system. This document explains
how retrieval works and how to construct legal contexts for the language
model.

## Memory architecture (§5, §6)

```
┌──────────────┐    promote (validated, versioned)    ┌──────────────┐
│   STM        │ ────────────────────────────────────→ │   LTM        │
│ (per-session)│ │  addLegislation / addProvision /   │ (persistent) │
│              │ │  addDefinition / addReasoning      │ │             │
│              │ ────────────────────────────────────→ │ │             │
│              │ │  promoteLegislationToLTM()         │ │             │
└──────────────┘                                     └──────────────┘
       │                                                      │
       │ unifiedQuery / legalQuery                            │ ltm.query / ltm.get
       │                                                      │
       ▼                                                      ▼
  Context injection                                       Targeted retrieval
  (compact prompt context)                          (by Act number, title, topic)
```

## STM — Short-term legal research context (§5)

During a research session, the agent uses STM to build a temporary context:

```js
import { createMemory } from '../.autoclaw/memory/index.js';
import { legalResearchContext, addLegislation } from '../.autoclaw/learnings/legal-promotion.mjs';

const mem = createMemory({ root: process.cwd() });

// 1. Start research session
legalResearchContext(mem, sessionId, "What does Act 884 say about director duties?");

// 2. Discover legislation
addLegislation(mem, sessionId, legislationRecord, {
  verified: true,
  confidence: 0.9,
});

// 3. Discover provisions
addProvision(mem, sessionId, {
  actNumber: "884",
  section: "132",
  text: "Every director must act in good faith...",
  sourceUrl: "https://lom.agc.gov.my/akta/Act%20884.pdf",
  verified: true,
});

// 4. Record reasoning
addReasoning(mem, sessionId, "Section 132 establishes the duty of care...", {
  confidence: 0.85,
  conclusion: "The Companies Act imposes fiduciary duties on directors.",
});
```

### STM lifecycle

- STM entries are **session-scoped** and expire after TTL (default: 30 min).
- STM entries are **bounded** (default: 100 entries per session).
- The agent should **compact** STM when it gets large: call
  `promoteLegislationToLTM()` to move verified legislation to LTM,
  then the STM entries are naturally evicted by TTL/capacity.
- **Do not** permanently store every STM entry. Only promoted, verified
  legislation enters LTM.

## LTM — Long-term legal knowledge (§6)

LTM stores durable legal knowledge as LTM entries with kind=`legislation`:

```js
import { encodeForLTM } from '../.autoclaw/learnings/legal-knowledge.mjs';
import { promoteSingleLegislation } from '../.autoclaw/learnings/legal-promotion.mjs';

// Promote a verified record to LTM
const result = promoteSingleLegislation(mem, legislationRecord);
if (result.promoted) {
  console.log(`Promoted Act ${legislationRecord.act_number} to LTM`);
}
```

### What gets promoted to LTM

| Candidate                | Promotion criteria                          |
|--------------------------|---------------------------------------------|
| Legislation metadata     | `provenance.trust === "authoritative"`       |
| Relationships            | Verified against AGC portal                  |
| Legal terminology        | Recurring, stable terms                      |
| Source locations         | Stable URL patterns                         |
| Structural info          | Legislative system organization             |
| Retrieval procedures     | Stable procedures for locating legislation   |

### What stays in STM only

- Temporary search results
- Unverified legal claims
- Speculative interpretations
- User-specific assumptions
- Reasoning traces (compacted after session)

## Retrieval priority (§8)

Retrieval functions implement a priority-ordered search:

1. **Exact Act number** — `retrieveByActNumber(mem, "884")`
2. **Exact title** — `retrieveByTitle(mem, "Companies Act 2016")`
3. **Topic/section** — `retrieveByTopic(mem, "director duties")`
4. **Current version** — `retrieveCurrentVersion(mem, "884")`
5. **Related legislation** — `retrieveAmendments(mem, "884")`, `retrieveSubsidiary(mem, "884")`
6. **Provenance** — authoritativeness ranking

Example:
```js
import { legalQuery, injectLegalContext } from '../.autoclaw/learnings/legal-retrieval.mjs';

const results = legalQuery(mem, {
  actNumber: "884",
  query: "director duties",
  limit: 5,
});

const context = injectLegalContext(mem, {
  actNumber: "884",
  limit: 3,
});
// → "[current] Companies Act 2016 (Act 884) — principal — authoritative — https://lom.agc.gov.my/..."
```

## Versioning & provenance (§7, §4)

Every LTM legislation entry stores:

```
metadata.versions: [{
  version: "2024-01-01",
  content_hash: "abc123...",
  status: "current",
  provenance: { source: "LOM", source_url: "...", retrieved_at: "...", trust: "authoritative" }
}, ...]
```

The current version is at index 0. All prior versions are preserved.
This ensures legal knowledge does not become stale or contradictory.

## Safety boundary (§9)

The system distinguishes **retrieval** from **legal advice**:

- When retrieving legislation, always cite the AGC source URL.
- When interpretation is uncertain, state the uncertainty explicitly.
- Never fabricate Act numbers, section numbers, or legal status.
- If evidence cannot be verified, return: "Insufficient verified evidence."

## See also (ASEAN cross-jurisdiction)

- `jurisdiction-MY.md` — Malaysia country profile and portal structure
- `asean-comparative.md` — Portal URLs and databases for all ASEAN jurisdictions
- `legal-research-workflow.md` — 16-step cross-jurisdiction research workflow
