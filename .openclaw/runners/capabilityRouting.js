// runners/capabilityRouting.js
const capabilities = {
  'legal-retrieve': ['openclaw', 'autogpt'],
  'legal-analyse': ['openclaw', 'claude-code'],
  'legal-draft': ['openclaw', 'cursor'],
};
function route(task) {
  const skill = task.skillName;
  const preferred = capabilities[skill] || ['openclaw'];
  return preferred[0];
}
module.exports = { route };
