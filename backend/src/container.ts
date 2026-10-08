/**
 * LAWMATE backend dependency container.
 *
 * Wires @lawmate/* packages as process-wide singletons so every tRPC router,
 * worker, and background job shares the same state. Import from here — do NOT
 * instantiate these classes directly in routers.
 */
import { KnowledgeGraph } from '@lawmate/kg';
import { VectorIndex } from '@lawmate/vector';
import { MemoryStore } from '@lawmate/memory';
import { EvidenceChain } from '@lawmate/evidence';
import {
  PolicyEngine,
  type AuditRecorder,
  type CapabilityChecker,
  type RateLimiter,
  createAuditRecorder,
  createCapabilityChecker,
  createRateLimiter,
} from '@lawmate/safety';
import { RegistryCatalog } from '@lawmate/registry';
import { SkillRegistry } from '@lawmate/skills';
import { ToolRegistry } from '@lawmate/tools';
import { TaskQueue } from '@lawmate/orchestrator';

export interface LawmateContainer {
  kg: KnowledgeGraph;
  vector: VectorIndex;
  memory: MemoryStore;
  evidence: EvidenceChain;
  policy: PolicyEngine;
  audit: AuditRecorder;
  authz: CapabilityChecker;
  rateLimiter: RateLimiter;
  registry: RegistryCatalog;
  skills: SkillRegistry;
  tools: ToolRegistry;
  tasks: TaskQueue;
}

let instance: LawmateContainer | undefined;

export function getContainer(): LawmateContainer {
  if (!instance) {
    instance = {
      kg: new KnowledgeGraph(),
      vector: new VectorIndex(),
      memory: new MemoryStore(),
      evidence: new EvidenceChain(),
      policy: new PolicyEngine(),
      audit: createAuditRecorder(),
      authz: createCapabilityChecker(),
      rateLimiter: createRateLimiter(),
      registry: new RegistryCatalog(),
      skills: new SkillRegistry(),
      tools: new ToolRegistry(),
      tasks: new TaskQueue(),
    };
  }
  return instance;
}
