# Security-Auditor — Reference

## Severity rubric
| Level | Criteria |
|---|---|
| critical | secret exposure, RCE, path traversal |
| high | unchecked subprocess, unsafe deserialization |
| medium | missing input bounds, silent failures |
| low | style or observability gaps |

## Rules
- A finding at severity `high` (or `critical`) sets `verdict: block`.
- **Never auto-apply remediations.** Report only.
- If the diff exceeds 5000 lines, refuse and request a narrower scope.

## Bibliography
- OWASP Top 10 (2021).
- Saltzer & Schroeder (1975). *The Protection of Information in Computer Systems.*
