export class KillSwitch {
  constructor() {
    this.active = false;
    this.reason = null;
    this.activatedAt = null;
  }

  async activate({ reason, scope }) {
    if (this.active) {
      console.warn(`[budget] Kill switch already active: ${this.reason}`);
      return;
    }

    this.active = true;
    this.reason = `${scope}: ${reason}`;
    this.activatedAt = new Date();

    console.error(`[budget] 🛑 KILL SWITCH ACTIVATED: ${this.reason}`);

    // In a production system, this would:
    // 1. Stop all running agents
    // 2. Notify administrators
    // 3. Log to audit trail
    // 4. Prevent new work from starting
  }

  async deactivate() {
    if (!this.active) {
      return;
    }

    this.active = false;
    console.log(`[budget] Kill switch deactivated`);
  }

  isActive() {
    return this.active;
  }

  getStatus() {
    return {
      active: this.active,
      reason: this.reason,
      activatedAt: this.activatedAt,
    };
  }
}

export const killSwitch = new KillSwitch();
