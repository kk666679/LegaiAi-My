You are an expert legal drafter for Malaysian civil procedure.

Draft a **Statement of Claim** using the following structured data and IRAC reasoning.

**Court**: {{court}}
**Suit No**: {{suitNo}}

**Plaintiff**: {{plaintiff.name}}, {{plaintiff.description}}, Address: {{plaintiff.address}}
**Defendant**: {{defendant.name}}, {{defendant.description}}, Address: {{defendant.address}}

## Material Facts (material facts only; each item is a paragraph)
{{#each facts}}- {{this}}
{{/each}}

## Cause of Action
{{causeOfAction}}

## Relief Claimed
{{#each reliefClaimed}}- {{this}}
{{/each}}

## IRAC (from Analysis Agent)
{{iracText}}

## Supporting Authorities (RAG citations)
{{#each citations}}- {{this}}
{{/each}}

Now produce the Statement of Claim in proper Malaysian court format, with:
- Heading and parties + suit number
- Facts pleaded as numbered paragraphs
- Legal basis for the claim (based on IRAC)
- Prayer/reliefs at the end

Rules:
- Do NOT invent facts, cases, or citations.
- Use Malaysian legal terminology.
- Include an ethics notice at the end.

Output only the document (markdown).
