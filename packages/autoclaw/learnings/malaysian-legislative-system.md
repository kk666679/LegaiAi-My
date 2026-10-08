---
id: learning-malaysian-legislative-system
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, system, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# Malaysian Federal Legislative System

**Source of truth.** The Attorney General's Chambers Malaysia (AGC) Federal
Legislation portal at `https://lom.agc.gov.my/` publishes the authoritative
versions of all Malaysian federal legislation. All legal knowledge in the
AutoClaw learning domain must be traceable to this source.

## Hierarchy of federal legislation

```
Federal Constitution
        │
        ▼
Principal Acts  (Act 1, 2, 3, … sequential, continuous numbering)
        │
        ├── Amendment Acts  (Act A1234, A1235, … "A" prefix = amendment)
        │
        ├── Subsidiary Legislation
        │       ├── P.U. (A)  — rules/regulations made by the Yang di-Pertuan Agong
        │       └── P.U. (B)  — rules made by other authorities
        │
        └── Ordinances       — temporary legislation (typically territorial, time-limited)
```

## Act numbering conventions

| Prefix | Meaning                          | Example        | Document type   |
|--------|----------------------------------|----------------|-----------------|
| (none) | Principal Act                    | Act 884        | `principal`     |
| `A`    | Amendment Act                    | Act A1620      | `amendment`     |
| (none) | Subsidiary / P.U.                | P.U. (A) 123   | `subsidiary`    |
| (none) | Ordinance                        | Ord. 1         | `ordinance`     |

- Principal Act numbers are continuous and sequential across all Acts.
- Amendment Act numbers use the `A` prefix and have their own separate sequence.
- **Never assign or fabricate an Act number.** Every Act number must come from
  the AGC portal.

## Portal sections

| Section                 | URL pattern                              | Content                        |
|-------------------------|------------------------------------------|--------------------------------|
| Federal Constitution    | `/constitution/`                         | Constitution of Malaysia       |
| Acts                    | `/akta/`                                 | Principal Acts, Amendment Acts |
| Subsidiary Legislation  | `/pu/`                                   | P.U. (A), P.U. (B)             |
| Ordinances              | `/ordinance/`                            | Ordinances                    |
| Search                  | `/search`                                | Full-text search across all    |

## Status values

| Status      | Meaning                                            |
|-------------|----------------------------------------------------|
| `current`   | In force — the latest revised version is active    |
| `amended`   | In force but has been amended by one or more Acts  |
| `repealed`  | Repealed — no longer in force                      |
| `historical`| Pre-independence or superseded                     |
| `unknown`   | Not yet verified against the AGC portal             |

## Versioning principle

The AGC portal maintains **revised versions** of Acts. When an Act is amended,
the AGC publishes a revised version incorporating the amendments. The learning
system must:

1. Store the `content_hash` of each record to detect changes.
2. Track `version` (revision date) when available.
3. Preserve old versions in `metadata.history` — never silently overwrite.
4. Prefer the latest authoritative version when answering.

## Retrieval priority (§8)

1. Exact Act number match (e.g. "884")
2. Exact title match (e.g. "Companies Act 2016")
3. Relevant section/provision
4. Current version status
5. Related legislation (amendments, subsidiary)
6. Official source provenance

## Legal safety boundary (§9)

The agent must distinguish **retrieving legislation** from **giving legal advice**.
When a provision or relationship cannot be verified against the AGC source,
the system returns:

> *"Insufficient verified evidence."*

Never fabricate Act numbers, section numbers, or legal status.

## See also (ASEAN cross-jurisdiction)

- `jurisdiction-MY.md` — Malaysia country profile (legal system, sources, structure)
- `asean-charter.md` — ASEAN Charter and regional institutions
- `asean-comparative.md` — Comparative tables across ASEAN jurisdictions
- `legal-research-workflow.md` — 16-step cross-jurisdiction research workflow
- `legal-terminology.md` — Malaysian legal terminology
