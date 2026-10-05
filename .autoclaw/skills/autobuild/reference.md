# Autobuild — Reference

## Contract
- **Never commit. Never push.** These are hard refusals.
- **Never mutate** the working tree beyond declared build outputs.
- **Escalate** on `EACCES` / `permission denied` — do not retry.

## Log truncation
Keep at most the last 200 lines of stdout+stderr. Older lines are dropped.
Preserve the last line — it usually carries the exit reason.

## Failure classes
| Class | Action |
|---|---|
| exit != 0 with compile error | return `failed`, include last 5 lines |
| exit != 0 with EACCES | escalate, do not retry |
| exit != 0 with network error | retry once, then escalate |

## Bibliography
- Humble, J. & Farley, D. (2010). *Continuous Delivery.*
