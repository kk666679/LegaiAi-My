import { diagTracer } from '../observability/tracer.js';

export class PlaybookRegistry {
  constructor() {
    this.playbooks = new Map();
    this.registerDefaults();
  }

  registerDefaults() {
    this.playbooks.set('resource_exhaustion', {
      action: 'restart_service',
      destructive: true,
      requiresApproval: true,
      execute: async ({ target }) => ({ action: 'restart', target }),
    });
    this.playbooks.set('network', {
      action: 'retry_with_backoff',
      destructive: false,
      requiresApproval: false,
      execute: async ({ target }) => ({ action: 'retry', target }),
    });
    this.playbooks.set('rate_limit', {
      action: 'backoff',
      destructive: false,
      requiresApproval: false,
      execute: async ({ target }) => ({ action: 'backoff', target }),
    });
    this.playbooks.set('auth', {
      action: 'escalate_to_human',
      destructive: false,
      requiresApproval: false,
      execute: async ({ target }) => ({ action: 'escalate', target }),
    });
    this.playbooks.set('crash', {
      action: 'isolate_and_restart',
      destructive: true,
      requiresApproval: true,
      execute: async ({ target }) => ({ action: 'isolate', target }),
    });
  }

  get(failureClass) {
    return this.playbooks.get(failureClass);
  }

  register(playbook) {
    this.playbooks.set(playbook.id ?? playbook.action, playbook);
  }
}
