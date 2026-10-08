import { FAILURE_TYPES } from '../failure-types.js';

export const TAXONOMY = {
  timeout: {
    children: ['network_timeout', 'db_timeout', 'external_api_timeout'],
    description: 'Operation exceeded time limit',
  },
  resource_exhaustion: {
    children: ['oom', 'disk_full', 'cpu_saturation', 'memory_leak'],
    description: 'System ran out of resources',
  },
  network: {
    children: ['connection_refused', 'connection_reset', 'dns_failure', 'socket_hangup'],
    description: 'Network communication failure',
  },
  auth: {
    children: ['token_expired', 'permission_denied', 'credential_invalid'],
    description: 'Authentication or authorization failure',
  },
  validation: {
    children: ['schema_mismatch', 'type_error', 'missing_field'],
    description: 'Input validation failure',
  },
  rate_limit: {
    children: ['api_throttle', 'quota_exceeded'],
    description: 'Rate limit exceeded',
  },
  dependency: {
    children: ['module_not_found', 'version_conflict', 'service_unavailable'],
    description: 'Dependency failure',
  },
  logic: {
    children: ['assertion_failed', 'invariant_violation', 'unexpected_state'],
    description: 'Logic or invariant failure',
  },
  crash: {
    children: ['segfault', 'oom_kill', 'process_exit'],
    description: 'Process crash',
  },
};

export function classifyToTaxonomy(failureClass) {
  return TAXONOMY[failureClass] ?? { children: [], description: 'Unknown failure class' };
}
