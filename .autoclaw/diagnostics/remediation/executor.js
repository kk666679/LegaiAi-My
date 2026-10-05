import { diagTracer } from '../observability/tracer.js';
import { PlaybookRegistry } from './playbook-registry.js';

export class RemediationExecutor {
  constructor({ requireApproval = true } = {}) {
    this.requireApproval = requireApproval;
    this.playbooks = new PlaybookRegistry();
  }

  async recommend({ rca, context }) {
    return diagTracer.startSpan('diagnostics.recommend', async (span) => {
      const action = this.playbooks.get(rca.class ?? 'unknown');
      span.setAttribute('recommendation.action', action?.action ?? 'none');
      span.setAttribute('recommendation.destructive', action?.destructive ?? false);

      if (!action) {
        return {
          action: 'manual_investigation',
          destructive: false,
          requiresApproval: true,
          reasoning: 'No matching playbook',
        };
      }

      return {
        action: action.action,
        destructive: action.destructive,
        requiresApproval: action.requiresApproval || this.requireApproval,
        playbook: rca.class,
      };
    });
  }

  async execute({ diagnosis, actor, approvalToken }) {
    return diagTracer.startSpan('diagnostics.execute', async (span) => {
      const playbook = this.playbooks.get(diagnosis.classification.class);
      if (!playbook) throw new Error(`No playbook for ${diagnosis.classification.class}`);

      if (playbook.requiresApproval && !approvalToken) {
        return { status: 'approval_required', action: playbook.action };
      }

      const result = await playbook.execute({ target: diagnosis.correlated.symptom });
      span.setAttribute('remediation.result', JSON.stringify(result));
      return { status: 'completed', result, actor };
    });
  }
}
