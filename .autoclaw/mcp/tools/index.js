'use strict';

const { ToolRegistry } = require('./registry');
const { fromSkillId, isValidName, inferInputSchema } = require('./schema');

/**
 * buildDefaultTools(deps) — assembles every tool group.
 *
 * deps: { registry, agents, kg, hitl, consensus, tasks, cache, obs }
 */
function buildDefaultTools(deps = {}) {
  const tr = new ToolRegistry();
  const groups = [
    require('./registry-introspect').build(deps),
    require('./agents').build(deps),
    require('./skills').build(deps),
    require('./kg').build(deps),
    require('./kdream').build(deps),
    require('./kgdream').build(deps),
    require('./hitl').build(deps),
    require('./consensus').build(deps),
    require('./tasks').build(deps),
    require('./cache').build(deps),
    require('./export').build(deps),
    require('./i18n').build(deps),
    require('./dataset').build(deps),
    require('./observability').build(deps)
  ];
  for (const group of groups) tr.registerAll(group);
  return tr;
}

module.exports = { ToolRegistry, buildDefaultTools, fromSkillId, isValidName, inferInputSchema };
