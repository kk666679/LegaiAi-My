# api/

HTTP route declarations for the platform's health and registry endpoints.

This is a **declaration layer, not a server**. The live Express app in
`backend/` owns the listeners; these records exist so the documented surface
and the intended auth posture live in one reviewable place.

## Routes
| Method | Path | Auth |
|---|---|---|
| GET | `/health` | no |
| GET | `/health/queue` | no |
| GET | `/health/ollama` | no |
| GET | `/metrics` | no |
| GET | `/audit` | yes |
| GET | `/api/v1/registry` | yes |
| GET | `/api/v1/health` | no |
| POST | `/api/v1/consensus/{task_id}/evaluate` | yes |

**No test coverage.** Satisfies the phase-3 preflight gate; treat as
unverified and reconcile against `backend/` before trusting it.
