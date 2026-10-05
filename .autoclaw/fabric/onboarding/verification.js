export class AgentVerification {
  verify(agentCard) {
    return {
      verified: true,
      id: agentCard.id,
      method: 'self-attested',
    };
  }
}
