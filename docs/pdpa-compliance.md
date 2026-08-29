---
title: PDPA Compliance Guide
id: pdpa-compliance
order: 7
---

# LAW MATE — PDPA Compliance Guide

LAW MATE is designed to comply with Malaysia's **Personal Data Protection Act 2010 (PDPA)** for all personal data processed through the platform.

---

## Data subjects and their rights

| Right | PDPA Section | How to exercise |
|-------|-------------|-----------------|
| Right of access | s. 30 | `GET /api/consent/:userId` or `/consent get <userId>` |
| Right of correction | s. 34 | Contact data controller directly |
| Right to withdraw consent | s. 38 | `/consent set <userId> --llm false --draft false` |
| Right to erasure | s. 38 | `/forget <userId>` (blocked if legal hold active) |

---

## PII types detected and redacted

The `legal_privacy` agent detects and redacts the following before any LLM call or vector indexing:

| PII Type | Pattern | Replacement |
|----------|---------|-------------|
| Malaysian IC | `801234-56-7890` | `[REDACTED-IC]` |
| Passport | `A12345678` | `[REDACTED-PASSPORT]` |
| Phone (MY) | `+6012-3456789` / `0123456789` | `[REDACTED-PHONE]` |
| Email | `user@domain.com` | `[REDACTED-EMAIL]` |
| Address | Jalan / Lorong / Taman / No. / Blok | `[REDACTED-ADDRESS]` |
| Bank account | 10–16 digit numeric strings | `[REDACTED-ACCOUNT]` |

---

## Consent management

Consent preferences are stored per user in the `UserConsent` table and cached in Redis for 24 hours.

```typescript
// Set consent
POST /trpc/agents.setConsent
{
  userId: "user-123",
  allowLLM: true,      // Allow sending data to LLM
  allowDraft: true,    // Allow generating draft documents
  dataRegion: "MY"     // Data residency — Malaysia only
}
```

**Default consent state**: `allowLLM: true`, `allowDraft: false`, `dataRegion: "MY"`

---

## Legal hold

A legal hold freezes all data associated with a user from deletion. It is applied when litigation is anticipated.

```bash
/hold case-abc-123
```

- Stored in `AuditLog.legalHold = true` and in agent state as `legal-hold:<userId>`
- The `NeverForgetUnderHold` rule (priority 300) **blocks** any `forget_user` call while a hold is active
- Legal holds must be explicitly released by an administrator

---

## Audit trail

Every agent action is logged to the `AuditLog` table with:

- SHA-256 hash chain linking each entry to the previous (`prevHash` → `hash`)
- `traceId` for end-to-end request tracing
- `durationMs` with Z-score anomaly detection (threshold: 3.0, window: 50)
- `legalHold` flag to prevent deletion of held records

Query audit logs:
```bash
GET /audit?traceId=<id>&agentName=legal-analysis&limit=20
```

---

## Data minimisation

Before any document is sent to the LLM or indexed into pgVector:

1. `legal_privacy` (redact) is called automatically by the `RedactBeforeLLM` rule (priority 200)
2. `legal_privacy` (redact) is called automatically by the `RedactBeforeIndex` rule (priority 150)
3. Party names are replaced with Party A / Party B labels by the `minimise` action

---

## Data residency

- All data is stored in PostgreSQL (`DATABASE_URL`) — configure to a Malaysian-hosted instance for MY data residency
- Redis is used for ephemeral queue data and consent cache only
- `dataRegion: "MY"` in consent preferences triggers residency logging
- No data is sent to external APIs unless `OLLAMA_URL` points to a cloud endpoint

---

## PDPA principles compliance mapping

| Principle | PDPA Section | Implementation |
|-----------|-------------|----------------|
| General principle (consent) | s. 6 | `UserConsent` table; consent required before LLM processing |
| Notice & choice | s. 7 | Consent preferences UI at `/legalai` |
| Disclosure | s. 8 | Data only shared with agents within the platform |
| Security | s. 9 | Hash-chained audit logs; encrypted `SESSION_SECRET` |
| Retention | s. 10 | Legal hold prevents premature deletion; `forget_user` for erasure |
| Data integrity | s. 11 | Checksum verification on indexed documents |
| Access | s. 12 | `/consent get` endpoint |
