/**
 * Planner — decomposes goals into executable steps.
 */
class Planner {
  constructor(opts = {}) {
    this.agent = agent;
    this.skillLoader = skillLoader;
  }

  async plan(goal, context) {
    // Load relevant skills
    const skills = await this.skillLoader.loadRelevant(goal);

    // Generate plan using agent
    const plan = await this.agent.plan({ goal, context, skills });

    return {
      steps: plan.steps || [],
      estimatedTurns: plan.estimatedTurns || 10,
      requiredSkills: plan.skills || [],
    };
  }
}

export { Planner };
