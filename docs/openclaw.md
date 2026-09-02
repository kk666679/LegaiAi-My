---
title: OpenClaw Integration
id: openclaw
order: 6
---

# LAW MATE — OpenClaw Integration

OpenClaw is the agent orchestration gateway. It loads skill files, registers tools, and exposes channels (HTTP, Telegram, WhatsApp).

---

## Starting OpenClaw

```bash
npm run openclaw
# or directly:
node .openclaw/index.js
```

OpenClaw reads configuration from `.openclaw/config.yml` on startup.

---

## Configuration files

| File | Purpose |
|------|---------|
| `.openclaw/config.yml` | Agent identity, model, skills, tools, memory, channels |
| `.openclaw/clawhub.yml` | ClawHub plugin registry declaration |
| `.openclaw/commands.yml` | Slash command definitions for all channels |
| `.openclaw/openprose.yml` | Multi-step resumable workflow definitions |

---

## Slash commands

All commands are available in HTTP, Telegram, and WhatsApp channels.

| Command | Description | Example |
|---------|-------------|---------|
| `/find` | Search Malaysian case law | `/find wrongful dismissal --court HIGH --top 8` |
| `/analyse` | IRAC legal analysis | `/analyse Does Article 8 apply to private employment?` |
| `/draft` | Draft a legal document | `/draft SUBMISSION --tone persuasive` |
| `/validate` | Check citation status | `/validate [2020] 3 MLJ 100` |
| `/debate` | Moot court simulation | `/debate No-poach clause enforceability --rounds 2` |
| `/redact` | Remove PII (PDPA) | `/redact Ahmad bin Ali, IC 801234-56-7890...` |
| `/consent` | Manage PDPA consent | `/consent set user-123 --llm true` |
| `/hold` | Apply legal hold | `/hold case-abc-123` |
| `/forget` | PDPA right to erasure | `/forget user-456` |
| `/run` | Full end-to-end pipeline | `/run Wrongful dismissal --probono --draft SUBMISSION` |
| `/subscribe` | Subscribe to topic alerts | `/subscribe user-123 "judicial review"` |
| `/trend` | Detect trend in series | `/trend 12 15 18 22 25 30` |
| `/index` | Index a document | `/index federal-court --approve paralegal@firm.com` |
| `/eval` | Run gold evaluation | `/eval` |
| `/benchmark` | Benchmark retrieval | `/benchmark` |
| `/status` | Queue health | `/status` |
| `/audit` | Query audit logs | `/audit --agent legal-analysis --limit 10` |
| `/help` | List commands | `/help /draft` |

---

## Adding a new skill

1. Create a skill file: `.openclaw/skills/my-skill.SKILL.md`
2. Register it in `.openclaw/config.yml` under `skills:`
3. Add the tool definition in `src/tools/index.ts`
4. Register the tool in `.openclaw/clawhub.yml` under `capabilities.tools`
5. Add slash commands in `.openclaw/commands.yml`
6. Restart OpenClaw: `npm run openclaw`

---

## Workflows (OpenProse)

Multi-step resumable workflows are defined in `.openclaw/openprose.yml`. Each workflow has:

- `trigger`: command or natural language phrases that activate it
- `steps`: ordered tool calls with conditions and approval gates
- `output`: summary template rendered after completion

Available workflows:

| ID | Trigger | Description |
|----|---------|-------------|
| `legal-research-draft` | `/run` | Full research → validate → redact → draft → audit |
| `citation-health-check` | `/validate` | Extract all citations, validate, colour-coded report |
| `moot-prep` | `/debate` | Retrieve → debate → moot brief |
| `index-pipeline` | `/index` | Redact → approval gate → index |
| `health-report` | `/eval` | Gold eval + benchmark → system health report |

---

## Memory keys

OpenClaw persists these keys across sessions:

| Key | Description |
|-----|-------------|
| `traceId` | Carried across turns for audit trail continuity |
| `citation` | Last validated citation |
| `userId` | Current user identifier |
| `caseId` | Active case identifier for legal hold checks |

---

## Model configuration

```yaml
model:
  default: ollama/llama3.1
  fallback: ollama/llama3.2:1b
  temperature: 0.2      # Low — legal precision
  maxTokens: 4096
```

The fallback model (`llama3.2:1b`) is used automatically if the primary model is unavailable. Override either via the `LLM_MODEL` and `LLM_MODEL_FALLBACK` environment variables; see `environment-variables.md`.

> **Note:** Tool restrictions for the fallback model (e.g. read-only `legal_retrieve` / `legal_validate`) are currently aspirational — the runtime does not yet enforce them. Do not rely on them for safety guarantees.
