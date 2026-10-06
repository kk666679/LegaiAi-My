---
id: learning-legal-terminology
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, terminology, reference, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# Malaysian Legal Terminology

This file documents the terminology used throughout the AutoClaw legal learning
domain. Consistency is critical for retrieval accuracy and provenance safety.

## Core entities

| Term               | Meaning                                             | Learning-system field   |
|--------------------|-----------------------------------------------------|-------------------------|
| **Act**            | An enactment of the Malaysian Parliament            | `act_number`            |
| **Principal Act**  | The original Act (numeric number, e.g. Act 884)       | `type: principal`       |
| **Amendment Act**  | An Act that amends a Principal Act (A-prefix, e.g. A1234) | `type: amendment` |
| **Subsidiary Leg.**| Rules/regulations made under an Act                 | `type: subsidiary`      |
| **P.U. (A)**       | Government notice made under Act of Yang di-Pertuan Agong | `type: pu_a`          |
| **P.U. (B)**       | Government notice made by other authorities          | `type: pu_b`            |
| **Ordinance**      | State or temporary law                              | `type: ordinance`       |
| **Federal Constitution** | The supreme law of Malaysia                  | `type: federal-constitution` |
| **Section**        | A provision of an Act (s. 1, s. 2)                  | `metadata.section`      |
| **Subsection**     | (1), (2), (3) within a section                      | —                       |
| **Paragraph**      | (a), (b), (c) within a subsection                   | —                       |
| **Sub-paragraph**  | (i), (ii), (iii) within a paragraph                 | —                       |
| **Clause**         | [a], [b], [c] within a sub-paragraph                | —                       |
| **Schedule**       | Appendix to an Act                                  | `metadata.schedule`     |
| **Article**        | Provision of the Federal Constitution               | `metadata.article`      |

## Status values

| Term            | Meaning                                  |
|-----------------|------------------------------------------|
| `current`       | In force; the latest revised version is active |
| `amended`       | In force but has been modified by amendments |
| `repealed`      | No longer in force; replaced or revoked  |
| `historical`    | Pre-independence or superseded law       |
| `unknown`       | Not yet verified against the AGC source  |

## Provenance trust levels

| Level          | Meaning                                    |
|----------------|--------------------------------------------|
| `authoritative`| Directly sourced from the AGC portal       |
| `secondary`    | Sourced from a reputable secondary source  |
| `uncertain`    | Unverified or from an unreliable source    |

## Relationship types

| Relationship    | Meaning                                  |
|-----------------|------------------------------------------|
| `amends`        | Amendment Act amends a Principal Act     |
| `amended_by`    | Principal Act is amended by an Act       |
| `subsidiary_of` | P.U. is made under a Principal Act       |
| `has_subsidiary`| Principal Act has subsidiary legislation |
| `repeals`       | Act repeals provisions of another Act     |
| `repealed_by`   | Act is repealed by another Act           |
| `replaced_by`   | Ordinance is replaced by a federal Act    |

## LOM portal terminology

| AGC term            | Learning-system equivalent |
|---------------------|-----------------------------|
| "Aktif"             | `status: current`           |
| "Tidak aktif"       | `status: repealed`          |
| "Bahasa"            | `language` field            |
| "Diluluskan"        | `royal_assent`              |
| "Disiarkan"         | `publication_date`          |
| "Berkuatkuasa"      | `commencement_date`         |
| "Semakimbang"       | `version` (revision date)   |

## Learning-level tags

All legislation LTM entries are tagged with:

| Tag prefix     | Example                | Purpose                    |
|----------------|------------------------|----------------------------|
| `legal`        | `legal`                | Domain marker              |
| `legal:act`    | `legal:act:884`        | Exact Act number           |
| `legal:type`   | `legal:type:principal` | Document type              |
| `legal:status` | `legal:status:current` | Current status             |
| `legal:jurisdiction` | `legal:jurisdiction:MY` | Jurisdiction          |
| `legal:parent` | `legal:parent:884`     | Parent Act (amendments)     |
| `legal:version`| `legal:version:2024-01-01` | Revision date           |
| `legal:lang`   | `legal:lang:en`        | Language                   |

## STM research context tags

During a legal research session, STM entries are tagged:

| Tag                     | Purpose                        |
|-------------------------|--------------------------------|
| `legal:research`        | Marks a research session       |
| `legal:question`       | The user's question            |
| `legal:legislation`    | Discovered legislation         |
| `legal:provision`      | Section/provision reference    |
| `legal:definition`     | Legal term definition          |
| `legal:amendment`     | Amendment relationship         |
| `legal:verification`   | Citation verification result   |
| `legal:reasoning`      | Agent reasoning/trace          |
| `legal:uncertainty`    | Unverified claim               |

## See also (ASEAN cross-jurisdiction)

- `jurisdiction-MY.md` — Malaysia country profile
- `asean-comparative.md` — Comparative terminology across ASEAN jurisdictions
- `legal-research-workflow.md` — Cross-jurisdiction research methodology
