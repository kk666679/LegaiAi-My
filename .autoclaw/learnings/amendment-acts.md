---
id: learning-amendment-acts
agent: hermes
sprint: sprint-2026-10-06
tags: [jurisdiction:MY, legislation, amendment, authoritative]
promoted: true
source: https://lom.agc.gov.my/
provenance: authoritative
---

# Amendment Acts of Malaysia

## Definition

An **Amendment Act** is an Act of Parliament that modifies a Principal Act
— inserting, deleting, or amending its sections, or repealing it entirely.

## Identification

- **Document type:** `amendment`
- **Act numbers:** Prefix `A` followed by digits (e.g., Act A1234, Act A1620)
- **URL pattern:** `https://lom.agc.gov.my/akta/Act%20A<number>.pdf`
- **Title format:** Typically `An Act to amend <Principal Act Title>`
  (e.g., "An Act to amend the Companies Act 2016")

## Key fields

| Field              | Source             | Notes                                   |
|--------------------|--------------------|-----------------------------------------|
| `act_number`       | AGC portal         | Prefixed with `A` (e.g. `A1234`)        |
| `title`            | AGC portal         | Contains "to amend"                     |
| `parent_act`       | Inferred from title | The Principal Act being amended        |
| `type`             | AGC portal         | `amendment`                             |
| `status`           | AGC portal         | Usually `current` (in force)             |

## Relationship model

Every Amendment Act has a **parent Act** (the Principal Act it amends):

```json
{
  "act_number": "A1234",
  "type": "amendment",
  "parent_act": "884",
  "title": "An Act to amend the Companies Act 2016",
  "relationships": [
    {
      "type": "amends",
      "target_act": "884",
      "target_title": "Companies Act 2016"
    }
  ]
}
```

## Retrieval guidance

- Query amendments to a Principal Act: `retrieveAmendments(mem, "884")`
  - Searches for entries where `type: "amendment"` and either
    `parent_act: "884"` or a relationship with `type: "amends"` → `target_act: "884"`
- Query by amendment Act number: `legal:act:A1234`
- Amendments are **not** repealed when the parent Act is repealed — each
  Act's status is tracked independently.

## Versioning

An Amendment Act typically has a single version. However, if the amendment
itself is later amended or repealed, its version history is tracked in
`metadata.versions`.

## Legal safety

When an Amendment Act amends a Principal Act, the Principal Act's revised
version on the AGC portal already incorporates the changes. The learning
system should:

1. Note that an amendment exists (store the Amendment Act record)
2. Note that the parent Act's revised version is current
3. Not present the amendment as the primary authority — the revised
   Principal Act is the authoritative source for the current law
