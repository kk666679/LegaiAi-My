// runners/dispatchViaRegistry.js
const { getRunner } = require('./registry');
async function dispatch(task, context) {
  const runnerName = task.runner || 'openclaw';
  const runner = getRunner(runnerName);
  return runner.run(task, context);
}
module.exports = { dispatch };
