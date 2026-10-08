/**
 * Seed agent activity tables with realistic rows.
 *
 * Idempotent: if agent_actions already has rows, exits without writing.
 *
 *   npx tsx backend/prisma/seed-agents.ts
 *
 * Writes into the three tables the agents page reads from:
 *   - AgentAction       (per-agent actions with status)
 *   - AuditLog          (per-agent audit entries with durationMs)
 *   - AIGovernanceLog   (per-model cost + tokens + latency)
 *
 * All values are constants — no Math.random, no faker.
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[seed-agents] DATABASE_URL is not set');
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

/** Catalogue matching AGENT_DEFS in use-agents.ts. */
const AGENTS = [
  { name: 'Orchestrator',        model: 'llama3.1', actionType: 'AUTOMATE',  authLevel: 3 },
  { name: 'Retrieval Agent',     model: 'llama3.1', actionType: 'RETRIEVE',  authLevel: 0 },
  { name: 'IRAC Engine',         model: 'llama3.1', actionType: 'RECOMMEND', authLevel: 1 },
  { name: 'Drafting Agent',      model: 'llama3.1', actionType: 'DRAFT',     authLevel: 2 },
  { name: 'Citation Validator',  model: 'llama3.1', actionType: 'RETRIEVE',  authLevel: 0 },
  { name: 'Critic',              model: 'llama3.1', actionType: 'RECOMMEND', authLevel: 1 },
  { name: 'Evaluator',           model: 'llama3.1', actionType: 'RECOMMEND', authLevel: 1 },
  { name: 'Privacy Agent',       model: 'llama3.1', actionType: 'EXECUTE',   authLevel: 3 },
  { name: 'Debate Agent',        model: 'llama3.1', actionType: 'RECOMMEND', authLevel: 1 },
  { name: 'Indexing Agent',      model: 'mxbai-embed-large', actionType: 'EXECUTE', authLevel: 2 },
  { name: 'Audit Agent',         model: 'llama3.1', actionType: 'EXECUTE',   authLevel: 3 },
  { name: 'Monitoring Agent',    model: 'llama3.1', actionType: 'RETRIEVE',  authLevel: 0 },
  { name: 'Testing Agent',       model: 'llama3.1', actionType: 'RECOMMEND', authLevel: 1 },
  { name: 'Sandbox Agent',       model: 'llama3.1', actionType: 'EXECUTE',   authLevel: 4 },
] as const;

/** Per-agent activity profile (counts over last 24h). Fixed values. */
const PROFILE: Record<string, { actions: number; audits: number; cost: number; tokensIn: number; tokensOut: number; latencyMs: number }> = {
  'Orchestrator':       { actions:  24, audits:  24, cost: 1.20, tokensIn: 180_000, tokensOut:  40_000, latencyMs: 4200 },
  'Retrieval Agent':    { actions:  88, audits:  88, cost: 0.44, tokensIn:  40_000, tokensOut:   8_000, latencyMs:  620 },
  'IRAC Engine':        { actions:  17, audits:  17, cost: 2.04, tokensIn: 102_000, tokensOut:  36_000, latencyMs: 8100 },
  'Drafting Agent':     { actions:  12, audits:  12, cost: 1.50, tokensIn:  90_000, tokensOut:  60_000, latencyMs: 7200 },
  'Citation Validator': { actions: 142, audits: 142, cost: 0.71, tokensIn:  32_000, tokensOut:   4_000, latencyMs:  380 },
  'Critic':             { actions:   9, audits:   9, cost: 0.54, tokensIn:  27_000, tokensOut:   9_000, latencyMs: 5600 },
  'Evaluator':          { actions:   6, audits:   6, cost: 0.30, tokensIn:  18_000, tokensOut:   3_000, latencyMs: 3200 },
  'Privacy Agent':      { actions:  31, audits:  31, cost: 0.15, tokensIn:  12_000, tokensOut:   2_000, latencyMs:  540 },
  'Debate Agent':       { actions:   3, audits:   3, cost: 0.48, tokensIn:  24_000, tokensOut:  12_000, latencyMs: 12400 },
  'Indexing Agent':     { actions: 204, audits: 204, cost: 0.20, tokensIn: 800_000, tokensOut:       0, latencyMs:  210 },
  'Audit Agent':        { actions:  48, audits:  48, cost: 0.16, tokensIn:   8_000, tokensOut:   2_000, latencyMs:  140 },
  'Monitoring Agent':   { actions:  72, audits:  72, cost: 0.28, tokensIn:  14_000, tokensOut:   4_000, latencyMs: 1800 },
  'Testing Agent':      { actions:   4, audits:   4, cost: 0.32, tokensIn:  16_000, tokensOut:   6_000, latencyMs: 4400 },
  'Sandbox Agent':      { actions:   7, audits:   7, cost: 0.09, tokensIn:   6_000, tokensOut:   1_000, latencyMs: 2100 },
};

async function main(): Promise<void> {
  const existing = await prisma.agentAction.count();
  if (existing > 0) {
    console.log(`[seed-agents] agent_actions already has ${existing} rows — skipping.`);
    return;
  }

  const now = Date.now();
  const hour = 3600_000;
  let actions = 0;
  let audits = 0;
  let governance = 0;

  for (const agent of AGENTS) {
    const profile = PROFILE[agent.name];
    if (!profile) continue;

    // ── AgentAction rows ────────────────────────────────────────
    for (let i = 0; i < profile.actions; i++) {
      const created = new Date(now - i * hour * (24 / profile.actions));
      const status = i % 11 === 0 ? 'rejected' : i % 7 === 0 ? 'pending' : 'executed';
      await prisma.agentAction.create({
        data: {
          agentName: agent.name,
          actionType: agent.actionType,
          authLevel: agent.authLevel,
          status,
          title: `${agent.name} · ${agent.actionType.toLowerCase()} ${i + 1}`,
          description: `${agent.actionType} task dispatched by ${agent.name}.`,
          aiModel: agent.model,
          toolsUsed: [],
          createdAt: created,
        },
      });
      actions++;
    }

    // ── AuditLog rows (one per action, with durationMs) ─────────
    for (let i = 0; i < profile.audits; i++) {
      const created = new Date(now - i * hour * (24 / profile.audits));
      const jitter = ((i * 131) % 400) - 200;
      await prisma.auditLog.create({
        data: {
          traceId: `seed-${agent.name}-${i}`,
          agentName: agent.name,
          action: agent.actionType.toLowerCase(),
          durationMs: Math.max(40, profile.latencyMs + jitter),
          createdAt: created,
        },
      });
      audits++;
    }

    // ── AIGovernanceLog rows (per-model cost aggregation) ──────
    const perRow = 6;
    for (let i = 0; i < perRow; i++) {
      const created = new Date(now - i * hour * (24 / perRow));
      await prisma.aIGovernanceLog.create({
        data: {
          eventType: 'MODEL_USED',
          aiModel: agent.model,
          provider: 'ollama',
          dataClass: 'internal',
          promptTokens: Math.floor(profile.tokensIn / perRow),
          completionTokens: Math.floor(profile.tokensOut / perRow),
          costUsd: +(profile.cost / perRow).toFixed(4),
          latencyMs: profile.latencyMs,
          createdAt: created,
        },
      });
      governance++;
    }
  }

  console.log(`[seed-agents] wrote ${actions} agent_actions, ${audits} audit_logs, ${governance} ai_governance_logs.`);
}

main()
  .catch((e) => {
    console.error('[seed-agents] failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
