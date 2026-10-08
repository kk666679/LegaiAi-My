---
id: learning-subsidiary-legislation
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, subsidiary, pu-a, pu-b, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# Subsidiary Legislation of Malaysia (P.U.)

## Overview

**Subsidiary legislation** consists of rules and regulations made by
authorities under the power delegated by Principal Acts (or the Constitution).
In the AGC portal, these are published as **P.U.** (Pemberituan Undang-Undang
/ Government Notices).

## Types

| Type      | Full name                | Authority                              | Example             |
|-----------|--------------------------|----------------------------------------|---------------------|
| `pu_a`    | P.U. (A)                 | Yang di-Pertuan Agong                  | P.U. (A) 123        |
| `pu_b`    | P.U. (B)                 | Other authorities (e.g., state govts)  | P.U. (B) 456        |
| `subsidiary`| Subsidiary legislation | Generic rule/regulation                | Rules 1 of 1990     |

## Identification

- **Document type:** `subsidiary` (general), `pu_a`, or `pu_b`
- **Identifiers:**
  - P.U. (A): `P.U. (A) <number>` (e.g., P.U. (A) 123)
  - P.U. (B): `P.U. (B) <number>` (e.g., P.U. (B) 456)
  - Rules: `<Name> Rules <year>` (e.g., Income Tax (Deduction) Rules 2019)

## Portal location

- **Main P.U. page:** `https://lom.agc.gov.my/pu/`
- **P.U. (A) listings:** Under each Principal Act page, the "P.U. (A)"
  tab lists all subordinate court rules made under that Act.
- **P.U. (B) listings:** Separate section for non-Yang di-Pertuan Agong rules.

## Parent Act relationship

Every P.U. or subsidiary rule is made **under** a specific Principal Act.
The `parent_act` field records this relationship:

```json
{
  "act_number": "P.U.(A) 123",
  "type": "pu_a",
  "parent_act": "6",
  "title": "Companies (Accounts) Rules 2019",
  "relationships": [
    { "type": "subsidiary_of", "target_act": "6", "target_title": "Companies Act 2016" }
  ]
}
```

## Retrieval guidance

- Query subsidiary legislation under an Act:
  `retrieveSubsidiary(mem, "6")`
  - Searches for entries where `type` is `subsidiary`, `pu_a`, or `pu_b`
    AND `parent_act` matches, OR a relationship of type `subsidiary_of`
    points to the parent Act
- Query by P.U. identifier: `legal:act:P.U.(A) 123`

## Key facts

- P.U. (A) are rules made under the authority of the **subordinate courts**
  or the **Yang di-Pertuan Agong** — typically procedural rules.
- P.U. (B) are rules made by authorities **other than** the Yang di-Pertuan
  Agong (e.g., state governments, professional bodies) — often regulatory.
- Both are subject to **parliamentary oversight** and can be revoked.
- Subsidiary legislation **cannot contradict** the Principal Act it is made
  under; if it does, the Principal Act prevails.

## Versioning

Subsidiary legislation is revised less frequently than Principal Acts. Each
P.U. has a single version date. When amended, the entire document is republished
with a new P.U. number (e.g., P.U. (A) 123 of 2019 vs P.U. (A) 123 of 2024).
