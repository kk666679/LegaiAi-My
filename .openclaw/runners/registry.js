// runners/registry.js
const registry = {
  openclaw: require('./openclaw'),
  autogpt: require('./autogpt'),
  'claude-code': require('./claude-code'),
  'claude-desktop': require('./claude-desktop'),
  codex: require('./codex'),
  cursor: require('./cursor'),
  fable: require('./fable'),
  gemini: require('./gemini-cli'),
  hermes: require('./hermes'),
  kiro: require('./kiro'),
  'local-coder': require('./local-coder'),
};
function getRunner(name) {
  return registry[name] || registry.openclaw;
}
module.exports = { getRunner, registry };
