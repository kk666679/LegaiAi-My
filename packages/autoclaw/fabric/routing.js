import * as agentTypes_1 from './agentTypes.js';

/**
 * routing.ts — AF-3: route work + reviews by agent TYPE, not just capabilities.
 *
 * Extends the existing capability match (orchestrate.ts jaccard) with the
 * agent-type taxonomy: an agent's effective capability set is its declared
 * capabilities PLUS its type's tags, and a review request can demand a
 * specific KIND of agent (e.g. an auditor, whose verdict is unanimous).
 * Pure + `vscode`-free.
 */
Object.defineProperty(exports, "__esModule", { value: true });

function effectiveTags(agent) {
    const type = agent.agent_type ?? 'coder';
    return new Set([...(agent.capabilities ?? []), ...(0, agentTypes_1.agentTypeProfile)(type).capabilityTags]);
}
/**
 * Rank agents for a required capability set. When `requiredType` is given, only
 * agents of that kind are considered. Highest jaccard score first; ties keep
 * input order (stable).
 */
function rankAgentsForCapabilities(agents, requiredCapabilities, requiredType) {
    const req = new Set(requiredCapabilities);
    return agents
        .filter(a => !requiredType || (a.agent_type ?? 'coder') === requiredType)
        .map(a => {
        const tags = effectiveTags(a);
        const intersection = [...req].filter(t => tags.has(t)).length;
        const union = new Set([...req, ...tags]).size;
        const score = union === 0 ? 0 : intersection / union;
        return { id: a.id, score, agent_type: (a.agent_type ?? 'coder') };
    })
        .sort((a, b) => b.score - a.score);
}
/** The agents eligible to review work of a required kind (e.g. auditors). */
function selectReviewers(agents, requiredType) {
    return agents.filter(a => (a.agent_type ?? 'coder') === requiredType);
}
/** The consensus rule a review of this kind requires (auditor ⇒ unanimous). */
function reviewConsensusRuleFor(requiredType) {
    return (0, agentTypes_1.consensusRuleForAgentType)(requiredType);
}
//# sourceMappingURL=routing.js.map

export { rankAgentsForCapabilities as rankAgentsForCapabilities, selectReviewers as selectReviewers, reviewConsensusRuleFor as reviewConsensusRuleFor };
