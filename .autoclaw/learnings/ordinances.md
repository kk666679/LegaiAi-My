---
id: learning-ordinances
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, ordinance, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# Ordinances of Malaysia

## Definition

**Ordinances** are laws enacted by the **State Legislative Assemblies** or
temporary federal legislation made under emergency powers. They are distinct
from Acts of Parliament (which are federal legislation).

## Identification

- **Document type:** `ordinance`
- **Identifiers:** Typically `Ord. <number>` (e.g., Ord. 1, Ord. 23)
- **Portal location:** `https://lom.agc.gov.my/ordinance/`
- **URL pattern:** Varies by year and state

## Key distinctions

| Feature          | Acts                     | Ordinances                |
|------------------|--------------------------|---------------------------|
| Authority        | Parliament (federal)     | State Assembly / Emergency|
| Numbering        | Continuous (Act 1, 2, 3…) | Per-assembly (Ord. 1, 2…)  |
| Scope            | Federal law              | State law / temporary     |
| Duration         | Permanent (unless repealed) | Often time-limited       |
| Parent           | Federal Constitution     | State Constitution / Constitution|

## Relationship to federal legislation

- Ordinances are **separate** from federal Acts and should not be confused
  with them in the learning system.
- Some Ordinances are made under constitutional provisions that grant
  state-level law-making authority.
- When an Ordinance is repealed and replaced by a federal Act, the relationship
  should be recorded in the `relationships` array:
  ```json
  {
    { "type": "replaced_by", "target_act": "1234" }
  ```

## Retrieval guidance

- Query by type: `legal:type:ordinance`
- Ordinances are stored with `jurisdiction: "MY"` but may have additional
  `metadata.sub_jurisdiction` for state-level context.
- Do not mix Ordinance results with Principal Act results when the user
  asks for "Act <number>" — Ordinance numbers follow a different sequence.

## Safety note

Ordinances can be **repealed** when the related emergency period ends or
when a state law is superseded. Always check the AGC portal's status label
before presenting an Ordinance as current law.
