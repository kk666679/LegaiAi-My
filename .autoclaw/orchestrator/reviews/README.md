# Reviews

Review reports written by `/orchestrate review <sprint>`, one file per sprint:
`sprint-{N}-review.md`.

Each report records:
- the rendered checklist from `skills/orchestrate/templates/review-checklist.md`
- gate results from `config.yaml#gates` (typecheck, lint, build, autoclaw-check)
- a verdict: `APPROVED`, `MINOR_ISSUES`, or `CRITICAL_ISSUES`

Verdict drives sprint status (spec review.5-6): `CRITICAL_ISSUES` sets the
sprint to `review` and lists required fixes; `APPROVED` or `MINOR_ISSUES`
sets it to `approved`.

Gate failures are never auto-merged — the failing command's output is quoted
in the report and the review stops there.