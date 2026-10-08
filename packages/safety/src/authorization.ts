/**
 * @lawmate/safety — Capability and authorization checks.
 */
import {
  Capability,
  Decision,
  LawmateError,
  ErrorCode,
  Actor,
  TenantContext,
} from '@lawmate/types';

export interface CapabilityChecker {
  hasCapability(actor: Actor, capability: Capability, context?: TenantContext): boolean;
  checkCapabilities(actor: Actor, capabilities: Capability[], context?: TenantContext): Decision;
}

export class InMemoryCapabilityChecker implements CapabilityChecker {
  private actorCapabilities = new Map<string, Set<Capability>>();

  grant(actorId: string, ...capabilities: Capability[]): void {
    const existing = this.actorCapabilities.get(actorId) || new Set();
    for (const c of capabilities) existing.add(c);
    this.actorCapabilities.set(actorId, existing);
  }

  revoke(actorId: string, ...capabilities: Capability[]): void {
    const existing = this.actorCapabilities.get(actorId);
    if (!existing) return;
    for (const c of capabilities) existing.delete(c);
  }

  hasCapability(actor: Actor, capability: Capability, _context?: TenantContext): boolean {
    const caps = this.actorCapabilities.get(actor.id);
    if (!caps) return false;
    return caps.has(capability) || caps.has('*');
  }

  checkCapabilities(actor: Actor, capabilities: Capability[], _context?: TenantContext): Decision {
    for (const cap of capabilities) {
      if (!this.hasCapability(actor, cap)) return 'DENY';
    }
    return 'ALLOW';
  }
}

export function createCapabilityChecker(): CapabilityChecker {
  return new InMemoryCapabilityChecker();
}

export function assertCapability(
  checker: CapabilityChecker,
  actor: Actor,
  capability: Capability,
  context?: TenantContext,
  requestId?: string
): void {
  if (!checker.hasCapability(actor, capability, context)) {
    const err: LawmateError = {
      code: 'AUTHORIZATION_ERROR',
      message: `Actor ${actor.id} lacks capability: ${capability}`,
      requestId,
      timestamp: new Date().toISOString(),
    };
    throw err;
  }
}

export function assertCapabilities(
  checker: CapabilityChecker,
  actor: Actor,
  capabilities: Capability[],
  context?: TenantContext,
  requestId?: string
): void {
  const decision = checker.checkCapabilities(actor, capabilities, context);
  if (decision === 'DENY') {
    const err: LawmateError = {
      code: 'AUTHORIZATION_ERROR',
      message: `Actor ${actor.id} lacks one or more required capabilities`,
      requestId,
      timestamp: new Date().toISOString(),
    };
    throw err;
  }
}

export function assertNotAgentSelfGrant(actor: Actor, targetActor: Actor, requestId?: string): void {
  if (actor.type === 'agent' && actor.id === targetActor.id) {
    const err: LawmateError = {
      code: 'AUTHORIZATION_ERROR',
      message: 'Agents cannot grant themselves new permissions',
      requestId,
      timestamp: new Date().toISOString(),
    };
    throw err;
  }
}