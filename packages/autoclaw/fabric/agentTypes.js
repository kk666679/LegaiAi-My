/**
 * agentTypes.ts — the agent-TYPE taxonomy for the multi-platform fabric.
 *
 * AutoClaw already has per-platform *runners* (Claude Code, Codex, Cursor,
 * Kilo, Hermes, OpenClaw, …) and per-role *personas*. What was missing is a
 * classification of agents by **what they do**, so the orchestrator can direct
 * work and route reviews by kind — not just "a coding agent" but runners,
 * auditors, supervisors, personal assistants, and governance actors — each
 * with an appropriate trust default, review posture, and human-in-loop rule.
 *
 * This is the conceptual layer the fabric RFC (docs/rfc/agent-fabric-platforms.md)
 * builds on. It is `vscode`-free and pure, so it unit-tests in plain node, and
 * it is consistent with the existing review controls in
 * `src/orchestrator/reviewSla.ts` (auditor ⇒ unanimous).
 */

export let AGENT_TYPES = void 0;

AGENT_TYPES = ['coder', 'runner', 'auditor', 'supervisor', 'assistant', 'governance'];
const PROFILES = {
    coder: {
        type: 'coder',
        description: 'Edits a repository under a task + scope + verify command.',
        defaultTrust: 'auto',
        consensusRule: 'majority',
        humanInLoop: false,
        canOrchestrate: false,
        capabilityTags: ['code', 'edit', 'test'],
    },
    runner: {
        type: 'runner',
        description: 'A callable task agent: one job, returns a structured result. No session.',
        defaultTrust: 'auto',
        consensusRule: 'none', // result-validated, not consensus-reviewed
        humanInLoop: false,
        canOrchestrate: false,
        capabilityTags: ['execute', 'callable', 'task'],
    },
    auditor: {
        type: 'auditor',
        description: 'Audits submitted work against a threat model; its findings gate merges.',
        defaultTrust: 'off', // read-only; never edits
        consensusRule: 'unanimous', // security-tier — matches reviewSla SECURITY_TIER_PERSONAS
        humanInLoop: false,
        canOrchestrate: false,
        capabilityTags: ['audit', 'security-review', 'read-only'],
    },
    supervisor: {
        type: 'supervisor',
        description: 'Manages and dispatches other agents; fans work out and aggregates results.',
        defaultTrust: 'auto',
        consensusRule: 'majority', // reviewed on outcome, not steps
        humanInLoop: false,
        canOrchestrate: true,
        capabilityTags: ['orchestrate', 'dispatch', 'aggregate'],
    },
    assistant: {
        type: 'assistant',
        description: 'Personal assistant — schedules, drafts, answers. Human-in-the-loop by default.',
        defaultTrust: 'off',
        consensusRule: 'none',
        humanInLoop: true,
        canOrchestrate: false,
        capabilityTags: ['assist', 'schedule', 'draft', 'answer'],
    },
    governance: {
        type: 'governance',
        description: 'Org-level actor — approves, sets policy, signs off. IS the control, not the controlled.',
        defaultTrust: 'off',
        consensusRule: 'none', // it approves others; it is not consensus-reviewed
        humanInLoop: true,
        canOrchestrate: true,
        capabilityTags: ['approve', 'policy', 'audit-log', 'escalation'],
    },
};
/** The full profile for an agent type. */
function agentTypeProfile(type) {
    return PROFILES[type];
}
/** The consensus rule to apply when reviewing this type's work. */
function consensusRuleForAgentType(type) {
    return PROFILES[type].consensusRule;
}
/** True when this type's actions require explicit human confirmation. */
function requiresHumanApproval(type) {
    return PROFILES[type].humanInLoop;
}
/**
 * Map a known persona id to its agent type. Personas are the role layer; this
 * resolves which *kind* of worker a persona is so routing + review controls
 * follow automatically. Unknown personas default to `coder`.
 *
 * Kept consistent with `reviewSla.SECURITY_TIER_PERSONAS` (those ⇒ auditor ⇒
 * unanimous).
 */
const PERSONA_TYPE = {
    'security-auditor': 'auditor',
    'supply-chain-auditor': 'auditor',
    'compliance-auditor': 'governance',
    'policy-enforcer': 'governance',
    'orchestrator': 'supervisor',
    'team-lead': 'supervisor',
    'assistant': 'assistant',
};
function agentTypeForPersona(personaId) {
    if (!personaId) {
        return 'coder';
    }
    return PERSONA_TYPE[personaId] ?? 'coder';
}
/**
 * A sensible DEFAULT agent type for a known platform runner. Most coding-agent
 * platforms default to `coder`; a personal-assistant platform like Hermes
 * defaults to `assistant`. This is only a registration default — a
 * `RegisteredAgent.agent_type` (the instance's role) always wins when set.
 */
const RUNNER_DEFAULT_TYPE = {
    hermes: 'assistant',
};
function defaultAgentTypeForRunner(runnerId) {
    return RUNNER_DEFAULT_TYPE[runnerId] ?? 'coder';
}
//# sourceMappingURL=agentTypes.js.map

export { agentTypeProfile as agentTypeProfile, consensusRuleForAgentType as consensusRuleForAgentType, requiresHumanApproval as requiresHumanApproval, agentTypeForPersona as agentTypeForPersona, defaultAgentTypeForRunner as defaultAgentTypeForRunner };
