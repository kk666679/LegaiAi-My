export class RunbookIndex {
  constructor() {
    this.runbooks = new Map();
  }

  index(runbook) {
    this.runbooks.set(runbook.id, runbook);
  }

  lookup(failureClass) {
    return [...this.runbooks.values()].filter((r) => r.failureClass === failureClass);
  }
}
