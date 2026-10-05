export class AuditLinker {
  constructor() {
    this.auditTrail = [];
  }

  link(event) {
    this.auditTrail.push({
      ...event,
      linkedAt: Date.now(),
    });
    return this.auditTrail.slice(-10);
  }
}
