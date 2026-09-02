// runners/loop-service-adapter.js
async function run(task, context) {
  const { run: openclawRun } = require('./openclaw');
  let result = null;
  for (let i = 0; i < (task.iterations || 1); i++) {
    result = await openclawRun(task, { ...context, iteration: i });
  }
  return result;
}
module.exports = { run };
