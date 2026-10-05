import { checkSubsystem } from '../../diagnostics/index.js';

export const healthCommand = {
  description: 'Check health of all subsystems',
  async run({ flags }) {
    const subsystems = [
      'fleet',
      'orchestrator',
      'memory',
      'skills',
      'eval',
      'mcp',
      'comms',
      'daemon',
      'budget',
      'kg',
      'vector',
    ];

    const results = await Promise.allSettled(
      subsystems.map(async (name) => ({
        name,
        ...(await checkSubsystem(name)),
      }))
    );

    const checks = results.map((r, i) => {
      if (r.status === 'fulfilled') return r.value;
      return {
        name: subsystems[i],
        ok: false,
        error: r.reason?.message ?? 'Unknown error',
      };
    });

    return {
      summary: {
        healthy: checks.filter((r) => r.ok).length,
        degraded: checks.filter((r) => !r.ok && r.error).length,
        total: checks.length,
        status: checks.every((r) => r.ok) ? 'healthy' : 'degraded',
      },
      checks: checks.sort((a, b) => (b.ok ? 1 : -1)),
    };
  },
};
