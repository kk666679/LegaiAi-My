---
id: learning-jurisdiction-MY
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, system, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
last_verified: 2026-10-06
---

# Malaysia — Legal System & Sources

## Identity

- **ISO 3166-1 alpha-2:** `MY`
- **Official name:** Malaysia (Malaysia)
- **Legal tradition:** Common law (English-derived), with Islamic law
  (Syariah) and Malay customary law (Adat) influences; federal
  structure with 13 states and 3 federal territories
- **Official language:** Bahasa Malaysia (English permitted for
  official purposes; the Federal Constitution has an authoritative
  Malay text and an official English translation)
- **Capital:** Kuala Lumpur (legislative/judicial seat);
  Putrajaya (administrative seat)

## Legal system overview

Malaysia retains a **common law system** inherited from British
colonial rule, layered with:

1. **Federal Constitution** — the supreme law; not numbered as an
   Act; organized into Articles grouped by Chapters
2. **Statutes** — Acts of Parliament (principal + amendment Acts) and
   subsidiary legislation (P.U. (A), P.U. (B))
3. **Common law** — judicial precedent is binding within the hierarchy;
   Privy Council appeals abolished 1985; the Federal Court is the
   final appellate court
4. **Islamic law (Syariah)** — administered through Syariah Courts for
   personal matters of Muslims; state-level enactment
5. **Customary law (Adat)** — Malay customary law, especially in land
   (Malay Reserve Land) and family matters; native customary law in
   Sabah and Sarawak
6. **Court structure** — Federal Court → Court of Appeal → High Court
   (Malaya / Sabah & Sarawak) → Sessions Court → Magistrates' Court;
   separate Syariah Court hierarchy; Native Courts in Sabah/Sarawak

## Secondary sources

| Source | URL | Notes |
|--------|-----|-------|
| Globalex | https://www.nyulawglobal.org/globalex/malaysia.htm | Authoritative secondary research guide |
| Melbourne Asian Law Guide | https://unimelb.libguides.com/asianlaw | General ASEAN research guide |

## Primary sources

| Source | URL | Authority level |
|--------|-----|-----------------|
| AGC Malaysia — Federal Legislation (LOM) | https://lom.agc.gov.my/ | Authoritative (current federal legislation) |
| Attorney General's Chambers Malaysia | https://www.agc.gov.my/ | Authoritative (official portal) |
| Federal Constitution | https://lom.agc.gov.my/constitution/ | Authoritative (supreme law) |

## Official gazettes

- **Gazette of Malaysia (Warta Kerajaan Persekutuan)** — publication
  of Acts, subsidiary legislation, and government notices; federal
  gazette series (Federally, part I/II)

## Numbering conventions

Malaysia uses **continuous sequential Act numbering** (not
year-based):

- **Act NNN** — Principal Act (e.g., Act 884 = Companies Act 2016);
  numbering is continuous across all principal Acts since 1950
- **Act A**nnn — Amendment Act (e.g., Act A1620); separate "A"
  sequence
- **P.U. (A) NNN** — subsidiary legislation made by the
  Yang di-Pertuan Agong
- **P.U. (B) NNN** — subsidiary legislation made by other authorities
- **Ordinance** — territorial/temporary legislation (e.g., Ord. 1)
- **Constitutional amendments** — Amendment Acts with
  `parent_act: "constitution"`

## Official languages

- **Bahasa Malaysia** is the authoritative language of legislation
- **English** is permitted for official purposes; most principal Acts
  are published bilingually (Malay authoritative, English official
  translation)
- **Bilingual support:** the Federal Constitution and most Acts carry
  both Malay and English texts; where they differ, the Malay text
  prevails for Acts enacted after 1963 unless the Act provides
  otherwise

## Bilingual / multilingual support

- Federal legislation is bilingual (Malay/English)
- State enactments vary; Sabah and Sarawak have additional customary
  law instruments
- Syariah enactments are typically Malay-only

## Retrieval guidance

- Query for `jurisdiction: "MY"`
- Primary source: LOM portal (lom.agc.gov.my)
- Use exact Act number (e.g., "884") or exact title (e.g.,
  "Companies Act 2016") for retrieval
- Verify currency via the AGC portal; Acts are published as revised
  versions incorporating amendments
- Amendment Acts are retrievable via `retrieveAmendments()`; subsidiary
  legislation via `retrieveSubsidiary()`
- Constitutional questions use `type: federal-constitution` and
  Article (not section) numbering

## Legal safety boundary

The system distinguishes **retrieving Malaysian legislation** from
**giving legal advice**. When a provision cannot be verified, the
system returns:
> *"Insufficient verified evidence."*

Never fabricate Act numbers, section numbers, or legal status.
Malaysian law must not be conflated with Singaporean, Indonesian, or
other common-law ASEAN jurisdictions — always bind results to
`jurisdiction: "MY"`.
