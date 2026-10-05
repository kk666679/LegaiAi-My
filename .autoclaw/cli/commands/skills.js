import { skillRegistry } from '../../skills/infrastructure/registry.js';

export const skillsCommand = {
  description: 'Manage skills (list, validate, run, promote)',
  async run({ subcommand, args, flags }) {
    switch (subcommand) {
      case 'list': {
        const skills = await skillRegistry.list();
        return {
          count: skills.length,
          skills: skills.map((s) => ({
            name: s.name,
            version: s.version,
            enabled: s.enabled,
            tags: s.tags ?? [],
          })),
        };
      }

      case 'validate': {
        const [skillName] = args;
        const skill = await skillRegistry.load(skillName);
        const errors = await skillRegistry.validate(skill);
        return {
          skill: skillName,
          valid: errors.length === 0,
          errors: errors.length > 0 ? errors : undefined,
        };
      }

      case 'run': {
        const [skillName, ...params] = args;
        const skill = await skillRegistry.load(skillName);
        const payload = flags.input ? JSON.parse(flags.input) : { args: params };
        const result = await skill.execute(payload);
        return { skill: skillName, result };
      }

      case 'promote': {
        const [skillName, targetEnv] = args;
        const result = await skillRegistry.promote(skillName, targetEnv ?? 'production');
        return { skill: skillName, promoted: true, environment: targetEnv ?? 'production' };
      }

      case 'info': {
        const [skillName] = args;
        const skill = await skillRegistry.load(skillName);
        return {
          name: skill.name,
          version: skill.version,
          description: skill.description,
          tags: skill.tags,
          parameters: skill.parameters,
          enabled: skill.enabled,
        };
      }

      default:
        throw new Error(`Unknown subcommand: ${subcommand}`);
    }
  },
};
