/**
 * @lawmate/types — public entry point.
 *
 * Note: `Confidence` and `Decision` are re-exported from `common.js` only.
 * kdream.ts has internal schemas with the same name (DecisionSchema2 etc.)
 * and re-exports them under the `Kdream*` prefix to avoid collision.
 */
export * from './common.js';
export * from './adapter.js';
export * from './agent.js';
export * from './audit.js';
export * from './autobuild.js';
export * from './comms.js';
export * from './dataset.js';
export * from './eval.js';
export * from './event.js';
export * from './evidence.js';
export * from './execution.js';
export * from './kg.js';
export * from './learning.js';
export * from './memory.js';
export * from './policy.js';
export * from './registry.js';
export * from './skill.js';
export * from './tool.js';
export * from './vector.js';

// kdream intentionally excluded from the barrel to avoid Confidence / Decision collision.
// Consumers who need it: `import type { KDREAMState } from '@lawmate/types/kdream'`
