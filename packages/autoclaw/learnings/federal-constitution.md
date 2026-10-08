---
id: learning-federal-constitution
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, federal-constitution, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# Federal Constitution of Malaysia

## Identity

- **Document type:** `federal-constitution`
- **Title:** Federal Constitution (Perlembagaan Persekutuan)
- **Not an Act** — the Constitution is the supreme law and is not numbered
  as an Act. It is the foundational document from which all other federal
  legislation derives authority.
- **Language:** Available in English and Bahasa Malaysia versions.

## Portal location

- URL: `https://lom.agc.gov.my/constitution/`
- The Constitution is organized into **Articles**, grouped by Chapters:
  - Chapter I: The Federation and the States (Preliminary)
  - Chapter II: The Malay Regalia and the Special Position of the Bumiputera
  - Chapter III: The Yang di-Pertuan Agong (King)
  - Chapter IV: The Cabinet and the Government
  - Chapter V: The Legislature
  - Chapter VI: The Judicial Appeal and the Courts
  - Chapter VII: Elections
  - Chapter VIII: The Malay Special Position
  - Chapter IX: Sabah and Sarawak
  - Chapter X: The Emergency
  - etc.

## Key structural knowledge

1. **Articles**, not sections — the Constitution uses "Article" numbering
   (e.g., Article 3, Article 15, Article 50).
2. **Amendments** to the Constitution use the prefix **Act A** followed by
   a number (e.g., Act A0001 for the first constitutional amendment).
3. The Constitution has been amended many times; each amendment is a
   separate Amendment Act.
4. Some Constitutional provisions have **scheduled** amendments (e.g.,
   the Sabah and Sarawak enactments).

## Retrieval guidance

- Query for `type: federal-constitution`
- Query for `act_number: "constitution"` (the canonical identifier used
  in the learning system)
- Section-type references use `article` rather than `section`
- Constitutional amendments are tagged `type: amendment` with
  `document_type: amendment`

## Versioning

The Constitution is periodically amended. Each amendment creates a new
Amendment Act (e.g., Act A0678). The **current revised Constitution**
incorporates all amendments to date. The learning system should track:

- The base Constitution (always "current" in the sense of being the supreme law)
- Each amendment as a separate record with `parent_act: "constitution"`
- The `relationships` array linking amendments to the Constitution

## See also (ASEAN cross-jurisdiction)

- `jurisdiction-MY.md` — Malaysia country profile
- `asean-charter.md` — ASEAN Charter and regional legal framework
- `asean-comparative.md` — Comparative tables across ASEAN jurisdictions
