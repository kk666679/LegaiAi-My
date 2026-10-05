'use strict';

const { Dreamer } = require('./dreamer');
const { Policy, DEFAULT_POLICY, CEILINGS } = require('./policies');

const PHASES = Object.freeze({
  replay:      require('./phases/replay').replay,
  consolidate: require('./phases/consolidate').consolidate,
  prune:       require('./phases/prune').prune,
  enrich:      require('./phases/enrich').enrich,
  reflect:     require('./phases/reflect').reflect
});

const MODES = Object.freeze({
  light:   ['replay', 'prune'],
  deep:    ['replay', 'consolidate', 'prune', 'enrich'],
  rem:     ['replay', 'enrich', 'reflect'],
  focused: ['replay', 'reflect']
});

const createDreamer = deps => new Dreamer(deps);

module.exports = { Dreamer, Policy, DEFAULT_POLICY, CEILINGS, PHASES, MODES, createDreamer };
