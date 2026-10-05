export class ApprovalGate {
  constructor({ requireApproval = true } = {}) {
    this.requireApproval = requireApproval;
    this.pending = new Map();
  }

  requiresApproval(action) {
    if (!this.requireApproval) return false;
    const destructiveActions = ['restart_service', 'isolate_and_restart', 'delete_data'];
    return destructiveActions.includes(action);
  }

  requestApproval(action, actor) {
    const token = crypto.randomUUID();
    this.pending.set(token, { action, actor, requestedAt: Date.now() });
    return { token, status: 'pending' };
  }

  approve(token, approver) {
    const request = this.pending.get(token);
    if (!request) return { approved: false, reason: 'not_found' };
    request.approved = true;
    request.approver = approver;
    request.approvedAt = Date.now();
    this.pending.delete(token);
    return { approved: true };
  }
}
