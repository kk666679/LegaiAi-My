// runners/openclaw.js – Default runner for OpenClaw skills
const { loadSkill } = require('../utils/skillLoader');

async function run(task, context) {
  const { skillName, params } = task;
  const skill = loadSkill(skillName);
  if (!skill) throw new Error(`Skill ${skillName} not found`);
  return skill.run(params, context);
}
module.exports = { run };
