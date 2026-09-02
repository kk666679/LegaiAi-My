// runners/reputationAssign.js
const reputation = {};
function assignReputation(runnerName, score) {
  reputation[runnerName] = score;
}
function getReputation(runnerName) {
  return reputation[runnerName] || 0.5;
}
module.exports = { assignReputation, getReputation };
