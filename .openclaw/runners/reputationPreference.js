// runners/reputationPreference.js
const { getReputation } = require('./reputationAssign');
function chooseRunner(task, candidates) {
  return candidates.reduce((best, r) => getReputation(r) > getReputation(best) ? r : best);
}
module.exports = { chooseRunner };
