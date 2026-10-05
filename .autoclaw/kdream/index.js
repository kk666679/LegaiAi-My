'use strict';

/**
 * kdream — memory consolidation.
 *
 * Resolves the default paths under `.autoclaw/` so callers can pass only
 * overrides.
 */

const path = require('path');
const { Dreamer, MODES } = require('./dreamer');
const { KdreamPolicy, DEFAULT_POLICY } = require('./policies');
const { DreamJournal } = require('./buffer');
const { CycleMetrics } = require('./metrics');
const memory = require('./memory');
const patterns = require('./patterns');

/**
 * memoryPath   → kdream/memory/MEMORY.md
 * learningsDir → learnings/
 */
function createDreamer(opts = {}) {
  const root = path.resolve(__dirname, '..');
  const { memoryPath, learningsDir, ...rest } = opts;
  return new Dreamer({
    memoryPath: memoryPath || path.join(root, 'kdream', 'memory', 'MEMORY.md'),
    learningsDir: learningsDir || path.join(root, 'learnings'),
    ...rest
  });
}

module.exports = {
  Dreamer,
  createDreamer,
  MODES,
  KdreamPolicy,
  DEFAULT_POLICY,
  DreamJournal,
  CycleMetrics,
  ...memory,
  ...patterns
};