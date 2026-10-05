// .autoclaw/agents/analysis/irac-engine.js
// Align with tests/autoclaw/irac-engine.test.js.

export const IRAC_STAGES = ["issue", "rule", "application", "conclusion"];

export class IRACEngine {
  constructor(opts = {}) { this.opts = opts; }

  async analyse(input = {}) {
    return {
      issue: input.issue ?? "",
      rule: input.rule ?? "",
      application: input.application ?? "",
      conclusion: input.conclusion ?? "",
      confidence: 0,
      authorities: input.authorities ?? [],
    };
  }

  analyseSync(input = {}) {
    return {
      issue: input.issue ?? "",
      rule: input.rule ?? "",
      application: input.application ?? "",
      conclusion: input.conclusion ?? "",
      confidence: 0,
      authorities: input.authorities ?? [],
    };
  }
}

export function createIRACEngine(opts) { return new IRACEngine(opts); }
export function runIRAC(input, opts) { return new IRACEngine(opts).analyse(input); }
export function runIRACSync(input, opts) { return new IRACEngine(opts).analyseSync(input); }

export default { IRACEngine, createIRACEngine, runIRAC, runIRACSync, IRAC_STAGES };
