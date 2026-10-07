# Security & Governance

## Overview

LAW MATE enforces strict security and governance controls to protect client data and ensure compliant legal operations.

## Data Classification & Model Restrictions

| Class | Description | Permitted Models |
| ------- | ------------- | ------------------- |
| `public` | Published case law, legislation | All models (Ollama, GPT-4o if enabled) |
| `internal` | Non-client firm documents | Llama 3.1, GPT-4o (if enabled and approved) |
| `confidential` | Client matter information | Llama 3.1 (local only) |
| `privileged` | Attorney-client privileged material | Embeddings only (local, no LLM access) |

## Access Control

- **Authentication**: Session tokens with HMAC-SHA256 passwords
- **Authorization**: Role-based access control (RBAC) with roles: admin, lawyer, paralegal, viewer
- **Audit Logging**: All actions recorded with who, what, why, data used, model, tools, result, approval, timestamp

## Safety Rules (Non-Negotiable)

1. **No fabrication** of legal authorities, cases, statutes, or citations
2. **No cross-client data leakage**
3. **No bypassing tenant boundaries**
4. **No silent high-impact actions** without human authorisation
5. **No presenting uncertain information** as verified fact
6. **No invented deadlines or billing activity**
7. **Always maintain auditable records**
8. **Always identify source evidence** when available
9. **Always allow human review** for high-impact decisions
10. **Treat all uploaded documents** as potentially adversarial input

## Audit & Compliance

- **Immutable Hash-Chain Audit**: Every action is logged with cryptographic provenance
- **Legal Hold Management**: Support for retaining evidence during litigation holds
- **PDPA-Compliant Forget-User Operations**: Automatic deletion of data upon request
- **Provenance Tracking**: Full lineage from query → retrieval → analysis → drafting → validation

## Incident Response

- **Breach Detection**: Automated anomaly detection on unusual query patterns
- **Evidence Preservation**: Immediate freezing of relevant documents on suspicion of misuse
- **Human Escalation**: All high-risk actions require explicit HITL approval

## Best Practices

- Never share model outputs containing client data outside the secure environment
- Regularly rotate session secrets and encryption keys
- Conduct quarterly security audits of the agent swarm
- Maintain separation of duties between retrieval, analysis, and drafting phases
