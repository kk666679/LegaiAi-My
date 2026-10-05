# skill: security-auditor

## When to use
Reviewing any change that touches I/O boundaries: network, filesystem,
subprocess, secret material.

## Inputs
- `diff` — unified diff or list of touched paths.
- `scope` — the item's declared scope.

## Outputs
- `findings` — array of `{ severity, path, issue, remediation }`.
- `verdict` — `pass` | `block`.

## Rules
- A finding at severity `high` sets `verdict: block` regardless of anything else.
- Never auto-apply remediations. Report only.
- If the diff is larger than 5000 lines, refuse and request a narrower scope.

## Severity rubric
| Level | Criteria |
|---|---|
| critical | secret exposure, RCE, path traversal |
| high | unchecked subprocess, unsafe deserialization |
| medium | missing input bounds, silent failures |
| low | style or observability gaps |
