import path from 'path';
import * as memory from './memory.js';
import * as patterns from './patterns.js';
import { Dreamer, MODES } from './dreamer.js';
import { KdreamPolicy, DEFAULT_POLICY } from './policies.js';
import { DreamJournal } from './buffer.js';
import { CycleMetrics } from './metrics.js';

/**
 * kdream — memory consolidation.
 *
 * Resolves the default paths under `.autoclaw/` so callers can pass only
 * overrides.
 */

/**
 * memoryPath   → kdream/memory/MEMORY.md
 * learningsDir → learnings/
 */
function createDreamer(opts = {}) {
  const root = path.resolve(import.meta.dirname, '..');
  const { memoryPath, learningsDir, ...rest } = opts;
  return new Dreamer({
    memoryPath: memoryPath || path.join(root, 'kdream', 'memory', 'MEMORY.md'),
    learningsDir: learningsDir || path.join(root, 'learnings'),
    ...rest
  });
}

;

export { Dreamer, createDreamer, MODES, KdreamPolicy, DEFAULT_POLICY, DreamJournal, CycleMetrics };
export * from './memory.js';
export * from './patterns.js';
