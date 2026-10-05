export class CapabilityMatcher {
  match(agent, requiredCapabilities) {
    const agentCaps = new Set(agent.capabilities ?? []);
    return requiredCapabilities.filter((c) => agentCaps.has(c));
  }
}
