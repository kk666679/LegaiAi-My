import EventEmitter from 'events';
import { createMemory } from '../memory/index.js';
import { skillRegistry } from '../skills/registry.js';
import { evalTracer } from '../eval/traces/store.js';

import { toolRegistry } from '../tools/registry.js';

class ChainEmptyError extends Error {
  constructor(agentId) {
    super(`Agent "${agentId}" has no chain`);
    this.name = 'ChainEmptyError';
    this.agentId = agentId;
  }
}

/**
 * agents/base-agent.js — Enhanced base agent with skills and eval hooks.
 *
 * Extends the existing BaseAgent with skill loading, eval tracing,
 * approval gates, and reflection capabilities.
 */
class BaseAgent extends EventEmitter {
  constructor({
    id,
    role,
    tier = 1,
    capabilities = [],
    skills = [],
    tools = [],
    memoryConfig = {},
    evalConfig = {},
    meta = {},
    runtime = null,
    chain = null,
  } = {}) {
    super();
    this.id = id;
    this.role = role;
    this.tier = tier;
    this.capabilities = capabilities;
    this.skillNames = skills;
    this.tools = tools;
    this.meta = meta;
    this.runtime = runtime;
    this.chain = chain || { skills: [...skills] };
    this.memory = createMemory({
      agentId: id,
      namespace: `agent:${id}`,
      config: memoryConfig,
    });
    this.evalConfig = evalConfig;
    this.skills = new Map();
    this.loaded = false;
    this.status = 'idle';
  }

  async load() {
    if (this.loaded) return;
    for (const skillName of this.skillNames) {
      const skill = await skillRegistry.load(skillName);
      this.skills.set(skillName, skill);
    }
    this.loaded = true;
    this.emit('loaded', { agentId: this.id, skills: [...this.skills.keys()] });
  }

  canHandle(intent) {
    return this.capabilities.includes(intent);
  }

  async run(goal, context = {}) {
    await this.load();
    const trace = evalTracer.start({ agentId: this.id, goal, context });

    try {
      // 1. Recall relevant memories
      const memoryContext = await this.memory.context(goal, { tokenBudget: context.tokenBudget ?? 3000 });
      trace.record('memory_recall', { tokensUsed: memoryContext.tokensUsed });

      // 2. Select skills for the task
      const selectedSkills = this.selectSkills(goal, context);
      trace.record('skill_selection', { skills: selectedSkills.map((s) => s.name) });

      // 3. Plan with memory + skills
      const plan = await this.plan(goal, { ...context, memory: memoryContext, skills: selectedSkills });
      trace.record('plan_created', { plan });

      // 4. Remember the plan
      await this.memory.remember(
        { goal, plan },
        { type: 'plan', salience: 0.7, tags: ['planning'] }
      );

      // 5. Execute with approval gate
      const result = await this.executeWithGates(plan, trace);

      // 6. Reflect
      const reflection = await this.reflect({ goal, plan, result });
      trace.record('reflection', { reflection });

      // 7. Remember the outcome
      await this.memory.remember(
        { goal, plan, result, reflection },
        { type: 'task_outcome', salience: 0.9, tags: ['outcome'] }
      );

      trace.finish({ status: 'success', result, reflection });
      return { agentId: this.id, plan, result, reflection, traceId: trace.id };
    } catch (error) {
      trace.finish({ status: 'error', error: error.message });
      this.emit('error', error);
      throw error;
    }
  }

  selectSkills(goal, context) {
    return [...this.skills.values()].filter((skill) => {
      return skill.canApply?.({ goal, context }) ?? true;
    });
  }

  async plan(goal, context) {
    throw new Error('plan() must be implemented');
  }

  async executeWithGates(plan, trace) {
    const results = [];
    for (const step of plan.steps ?? []) {
      if (this.isDestructive(step)) {
        const approved = await this.requestApproval(step);
        trace.record('approval_requested', { step, approved });
        if (!approved) {
          return { status: 'cancelled', step, results };
        }
      }
      const stepResult = await this.invokeStep(step, trace);
      results.push(stepResult);
    }
    return { status: 'completed', results };
  }

  isDestructive(step) {
    return step.destructive === true ||
      (step.tool && (step.tool.includes('delete') || step.tool.includes('reboot')));
  }

  async requestApproval(step) {
    this.emit('approval_required', { agentId: this.id, step });
    return new Promise((resolve) => this.once('approval_response', resolve));
  }

  async invokeStep(step, trace) {
    const start = Date.now();
    try {
      let output;
      if (step.skill) {
        const skill = this.skills.get(step.skill);
        if (!skill) throw new Error(`Skill ${step.skill} not loaded`);
        output = await skill.invoke(step.input, { memory: this.memory, trace });
        trace.record('skill_call', { skill: step.skill, input: step.input, durationMs: Date.now() - start, status: 'ok' });
      } else if (step.tool) {
        output = await this.invokeTool(step.tool, step.input);
        trace.record('tool_call', { tool: step.tool, input: step.input, durationMs: Date.now() - start, status: 'ok' });
      } else {
        output = await this.executeStep(step);
        trace.record('step', { step, durationMs: Date.now() - start, status: 'ok' });
      }
      return { step: step.skill ?? step.tool ?? 'step', output, status: 'ok' };
    } catch (error) {
      trace.record('error', { step: step.skill ?? step.tool ?? 'step', error: error.message });
      return { step: step.skill ?? step.tool ?? 'step', error: error.message, status: 'error' };
    }
  }

  async invoke(input = {}) {
    if (!this.chain || !Array.isArray(this.chain.skills) || this.chain.skills.length === 0) {
      throw new ChainEmptyError(this.id);
    }

    let combined = { ...(input || {}) };
    let output = {};
    const steps = [];
    for (const skillName of this.chain.skills) {
      const impl = this.runtime?.skills?.[skillName];
      if (!impl || typeof impl !== 'function') {
        steps.push({ skill: skillName, ok: false, reason: 'no-implementation' });
        continue;
      }
      try {
        const result = await impl(combined, {
          prev: output,
          outputs: { ...output, ...steps.reduce((acc, step) => Object.assign(acc, step.output || {}), {}) },
          input: combined,
        });
        combined = { ...combined, ...(result || {}) };
        output = { ...output, ...(result || {}) };
        steps.push({ skill: skillName, ok: true, output: result });
      } catch (error) {
        steps.push({ skill: skillName, ok: false, reason: error.message, error: error.message });
        return { agent: this.id, outcome: 'failed', reason: error.message, output, steps };
      }
    }

    const hasMissing = steps.some((s) => s.reason === 'no-implementation');
    if (hasMissing) {
      return { agent: this.id, outcome: 'escalate', reason: 'empty-output', output, steps };
    }

    return { agent: this.id, outcome: 'ok', output, steps };
  }

  async invokeTool(tool, input) {

    const t = toolRegistry.get(tool);
    if (!t) throw new Error(`Tool ${tool} not registered`);
    return t.handler(input);
  }

  async executeStep(step) {
    // Override in subclass for custom step execution
    throw new Error('executeStep() not implemented');
  }

  async reflect({ goal, plan, result }) {
    return { learned: [], improvements: [] };
  }

  async onSessionEnd() {
    await this.memory.consolidate({ force: true });
    this.memory.stm.dispose();
    this.emit('session_end', { agentId: this.id });
  }

  approve(step) {
    return { approved: true, reason: 'auto-approved' };
  }
}

export { BaseAgent, ChainEmptyError };
