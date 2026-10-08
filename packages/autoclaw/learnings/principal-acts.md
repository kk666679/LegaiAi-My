---
id: learning-principal-acts
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, principal-act, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# Principal Acts of Malaysia

## Definition

A **Principal Act** is an Act of Parliament enacted by the Dewan Rakyat
(House of Representatives) and Dewan Negara (Senate), having passed
three readings and received the Yang di-Pertuan Agong's assent.

## Identification

- **Document type:** `principal`
- **Act numbers:** Pure numeric (e.g., Act 1, Act 34, Act 884)
- **URL pattern:** `https://lom.agc.gov.my/akta/Act%20<number>.pdf`
- **Title format:** Typically `<Descriptive Name> Act <Year>` (e.g.,
  "Companies Act 2016", "Employment Act 1955", "Sales and Service Tax
  Act 2018")

## Key fields

| Field              | Source             | Notes                                |
|--------------------|--------------------|--------------------------------------|
| `act_number`       | AGC portal         | Pure numeric, no prefix              |
| `title`            | AGC portal         | Official short title                 |
| `year`             | Title              | Extracted from title (e.g. 2016)     |
| `royal_assent`     | AGC portal         | Date of royal assent — may be null    |
| `publication_date` | AGC portal         | Date of publication in Gazette       |
| `commencement_date`| AGC portal         | Date the Act came into operation      |
| `version`          | AGC portal         | Revision date of current version      |
| `status`           | AGC portal         | `current`, `amended`, `repealed`      |

## Structure of an Act

1. **Short title** — the Act's name (also called the "title")
2. **Long title** — a descriptive preamble (e.g., "An Act to re-enact..." )
3. **Preamble** (if any)
4. **Sections** — numbered provisions (s. 1, s. 2, …)
   - **Subsections** (1), (2), (3)…
   - **Paragraphs** (a), (b), (c)…
   - **Sub-paragraphs** (i), (ii), (iii)…
   - **Clauses** [a], [b], [c]…
5. **Schedules** — Appendix to the Act (Schedule 1, Schedule 2, …)

## Relationship types

| Relationship       | Direction                         | Meaning                                   |
|--------------------|-----------------------------------|-------------------------------------------|
| `amends`           | Amendment → Principal Act        | This Act amends the parent Act            |
| `amended_by`       | Principal Act → Amendment        | This Act has been amended by the Act       |
| `has_subsidiary`   | Principal Act → P.U.            | This Act has subsidiary legislation        |
| `subsidiary_of`    | P.U. → Principal Act            | This P.U. is made under the parent Act     |
| `repeals`          | Amendment → Principal Act       | This Act repeals provisions of the parent |

## Retrieval guidance

- Query by exact Act number: `legal:act:884`
- Query by title keyword: text search on `title`
- Query by type: `legal:type:principal`
- Query by status: `legal:status:current` (or `legal:status:repealed`, etc.)

## Versioning (§7)

Principal Acts on the AGC portal are maintained as **revised versions**.
When amendments are made, the AGC publishes an updated PDF incorporating
the changes. The learning system:

- Stores `content_hash` to detect if a new PDF differs from the stored one
- Stores `version` as the revision date (when available)
- Appends old versions to `metadata.versions` array
- Current version is always retrievable via `retrieveCurrentVersion()`

> **Never assume an Act is current based on search results alone.** Always
> verify the AGC portal's status label. An Act that appears in search
> results may be repealed or historical.
