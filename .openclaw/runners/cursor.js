// runners/cursor.js
async function run(task, context) {
  const { run: openclawRun } = require('./openclaw');
  return openclawRun(task, context);
}
module.exports = { run };
